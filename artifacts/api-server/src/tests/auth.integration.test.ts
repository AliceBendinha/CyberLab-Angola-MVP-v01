import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import { UserRole } from "@prisma/client";
import type { AuthUser } from "@workspace/api-zod";
import app from "../app";
import { prisma } from "../config/prisma";

const runId = randomUUID();
const emailPrefix = `auth-test-${runId}-`;
const studentEmail = `${emailPrefix}student@example.test`;
const instructorEmail = `${emailPrefix}instructor@example.test`;
const adminEmail = `${emailPrefix}admin@example.test`;
const rolePassword = "test-password-123";
let server: Server;
let apiBaseUrl = "";
let studentCookie = "";
let instructorCookie = "";
let adminCookie = "";
const publicUserResponses: unknown[] = [];

function requestHeaders(cookie?: string) {
  return {
    Origin: new URL(apiBaseUrl).origin,
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

async function postJson(
  path: string,
  body: unknown,
  cookie?: string,
): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      ...requestHeaders(cookie),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function get(path: string, cookie?: string): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    headers: requestHeaders(cookie),
  });
}

function readCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "expected an authentication cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  return setCookie.split(";")[0]!;
}

async function signIn(email: string): Promise<string> {
  const response = await postJson("/auth/login", {
    email,
    password: rolePassword,
  });
  assert.equal(response.status, 200);
  publicUserResponses.push(await response.json());
  return readCookie(response);
}

describe("authentication and role access", { concurrency: false }, () => {
  before(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const address = server.address();
    assert.ok(address && typeof address !== "string");
    apiBaseUrl = `http://127.0.0.1:${address.port}/api`;

    const passwordHash = await bcrypt.hash(rolePassword, 12);
    await prisma.user.createMany({
      data: [
        {
          name: "Instructor test",
          email: instructorEmail,
          passwordHash,
          role: UserRole.INSTRUCTOR,
        },
        {
          name: "Administrator test",
          email: adminEmail,
          passwordHash,
          role: UserRole.ADMIN,
        },
      ],
    });

    instructorCookie = await signIn(instructorEmail);
    adminCookie = await signIn(adminEmail);
  });

  after(async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: emailPrefix } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);

    if (userIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  test("1. registers a valid account as STUDENT", async () => {
    const response = await postJson("/auth/register", {
      name: "Student test",
      email: `  ${studentEmail.toUpperCase()} `,
      password: "student-password-123",
    });
    assert.equal(response.status, 201);
    const body = (await response.json()) as AuthUser;
    publicUserResponses.push(body);
    studentCookie = readCookie(response);
    assert.equal(body.email, studentEmail);
    assert.equal(body.role, "STUDENT");
    assert.deepEqual(Object.keys(body).sort(), ["email", "id", "name", "role"]);
  });

  test("2. rejects an invalid email", async () => {
    const response = await postJson("/auth/register", {
      name: "Invalid test",
      email: "not-an-email",
      password: "valid-password-123",
    });
    assert.equal(response.status, 400);
  });

  test("3. rejects a password shorter than eight characters", async () => {
    const response = await postJson("/auth/register", {
      name: "Short password test",
      email: `${emailPrefix}short@example.test`,
      password: "short",
    });
    assert.equal(response.status, 400);
  });

  test("4. rejects a duplicate email after normalization", async () => {
    const response = await postJson("/auth/register", {
      name: "Duplicate test",
      email: studentEmail.toUpperCase(),
      password: "another-password-123",
    });
    assert.equal(response.status, 409);
  });

  test("5. logs in with valid credentials", async () => {
    const response = await postJson("/auth/login", {
      email: studentEmail.toUpperCase(),
      password: "student-password-123",
    });
    assert.equal(response.status, 200);
    publicUserResponses.push(await response.json());
    studentCookie = readCookie(response);
  });

  test("6. rejects invalid credentials without identifying the failed field", async () => {
    const unknownEmailResponse = await postJson("/auth/login", {
      email: `${emailPrefix}missing@example.test`,
      password: rolePassword,
    });
    const wrongPasswordResponse = await postJson("/auth/login", {
      email: studentEmail,
      password: "incorrect-password",
    });
    assert.equal(unknownEmailResponse.status, 401);
    assert.equal(wrongPasswordResponse.status, 401);
    assert.deepEqual(
      await unknownEmailResponse.json(),
      await wrongPasswordResponse.json(),
    );
  });

  test("7. restores the authenticated user through /auth/me", async () => {
    const response = await get("/auth/me", studentCookie);
    assert.equal(response.status, 200);
    const body = (await response.json()) as AuthUser;
    publicUserResponses.push(body);
    assert.equal(body.id.length > 0, true);
    assert.equal(body.name, "Student test");
    assert.equal(body.email, studentEmail);
    assert.equal(body.role, "STUDENT");
    assert.deepEqual(Object.keys(body).sort(), ["email", "id", "name", "role"]);
  });

  test("8. rejects requests without a session with HTTP 401", async () => {
    for (const path of ["/auth/me", "/test/student", "/test/admin"]) {
      const response = await get(path);
      assert.equal(response.status, 401, `${path} should require authentication`);
    }
  });

  test("9. allows every authenticated role to access the student route", async () => {
    for (const cookie of [studentCookie, instructorCookie, adminCookie]) {
      const response = await get("/test/student", cookie);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    }
  });

  test("10. rejects STUDENT access to the admin route", async () => {
    const response = await get("/test/admin", studentCookie);
    assert.equal(response.status, 403);
  });

  test("11. allows INSTRUCTOR access to the instructor route", async () => {
    for (const cookie of [instructorCookie, adminCookie]) {
      const response = await get("/test/instructor", cookie);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    }
  });

  test("12. rejects INSTRUCTOR access to the admin route", async () => {
    const response = await get("/test/admin", instructorCookie);
    assert.equal(response.status, 403);
  });

  test("13. allows ADMIN access to the admin route", async () => {
    const response = await get("/test/admin", adminCookie);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });

  test("14. logout invalidates the existing session", async () => {
    const forgedOriginResponse = await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        Origin: "https://hostile.invalid",
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: "{}",
    });
    assert.equal(forgedOriginResponse.status, 403);

    const response = await postJson("/auth/logout", {}, studentCookie);
    assert.equal(response.status, 204);
    assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i);
    const meResponse = await get("/auth/me", studentCookie);
    assert.equal(meResponse.status, 401);
  });

  test("15. public auth responses never contain passwordHash", () => {
    assert.ok(publicUserResponses.length >= 4);
    for (const body of publicUserResponses) {
      assert.equal(
        typeof body === "object" &&
          body !== null &&
          "passwordHash" in body,
        false,
      );
    }
  });

  test("16. preserves the existing health response", async () => {
    const response = await get("/health");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ok",
      service: "CyberLab Angola API",
    });
  });
});
