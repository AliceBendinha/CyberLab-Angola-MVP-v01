import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import { MissionDifficulty, Prisma, UserRole } from "@prisma/client";
import type {
  AuthUser,
  DiagnosticQuestionsResponse,
  DiagnosticResultResponse,
  MissionAttemptRecord,
  MissionAttemptResult,
  StudentProfile,
  StudentProgressResponse,
} from "@workspace/api-zod";
import app from "../app";
import { prisma } from "../config/prisma";

const runId = randomUUID();
const emailPrefix = `learning-test-${runId}-`;
const studentEmail = `${emailPrefix}student@example.test`;
const secondStudentEmail = `${emailPrefix}other@example.test`;
const instructorEmail = `${emailPrefix}instructor@example.test`;
const adminEmail = `${emailPrefix}admin@example.test`;
const password = "learning-test-password-123";
const hiddenSlug = `learning-test-hidden-${runId}`;
const hiddenMissionSlug = `learning-test-unpublished-${runId}`;
let hiddenModuleId: string | undefined;
let server: Server;
let apiBaseUrl = "";
let studentCookie = "";
let secondStudentCookie = "";
let instructorCookie = "";
let adminCookie = "";

const correctDiagnosticOptionIds = [
  "a",
  "a",
  "b",
  "c",
  "b",
  "a",
  "c",
  "b",
  "a",
  "c",
];

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

async function patchJson(
  path: string,
  body: unknown,
  cookie: string,
): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method: "PATCH",
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

function runSeed(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["exec", "tsx", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("The isolated seed command failed."));
      }
    });
  });
}

function readCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "expected an authentication cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  return setCookie.split(";")[0]!;
}

async function registerStudent(email: string): Promise<string> {
  const response = await postJson("/auth/register", {
    name: "Estudante de teste",
    email,
    password,
  });
  assert.equal(response.status, 201);
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal("passwordHash" in body, false);
  return readCookie(response);
}

async function diagnosticAnswers(correctCount: number) {
  const response = await get("/diagnostic", studentCookie);
  assert.equal(response.status, 200);
  const diagnostic = (await response.json()) as {
    questions: { id: string; options: { id: string }[] }[];
  };
  return diagnostic.questions.map((question, index) => {
    const correctOptionId = correctDiagnosticOptionIds[index]!;
    const selectedOptionId =
      index < correctCount
        ? correctOptionId
        : question.options.find((option) => option.id !== correctOptionId)!.id;
    return { questionId: question.id, selectedOptionId };
  });
}

describe("student learning engine", { concurrency: false }, () => {
  before(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const address = server.address();
    assert.ok(address && typeof address !== "string");
    apiBaseUrl = `http://127.0.0.1:${address.port}/api`;

    studentCookie = await registerStudent(studentEmail);
    secondStudentCookie = await registerStudent(secondStudentEmail);

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.createMany({
      data: [
        {
          name: "Instructor de teste",
          email: instructorEmail,
          passwordHash,
          role: UserRole.INSTRUCTOR,
        },
        {
          name: "Administrador de teste",
          email: adminEmail,
          passwordHash,
          role: UserRole.ADMIN,
        },
      ],
    });

    for (const [email, setCookie] of [
      [instructorEmail, (cookie: string) => (instructorCookie = cookie)],
      [adminEmail, (cookie: string) => (adminCookie = cookie)],
    ] as const) {
      const response = await postJson("/auth/login", { email, password });
      assert.equal(response.status, 200);
      setCookie(readCookie(response));
    }

    const publishedModule = await prisma.learningModule.findUniqueOrThrow({
      where: { slug: "fundamentos-ciberseguranca" },
      select: { id: true },
    });
    await prisma.learningModule.create({
      data: {
        title: "Módulo não publicado de teste",
        slug: hiddenSlug,
        description: "Conteúdo privado usado apenas no teste isolado.",
        order: 999,
        published: false,
      },
    }).then((module) => {
      hiddenModuleId = module.id;
    });
    await prisma.mission.create({
      data: {
        moduleId: publishedModule.id,
        title: "Missão não publicada de teste",
        slug: hiddenMissionSlug,
        description: "Missão privada usada apenas no teste isolado.",
        scenario: "Cenário de teste isolado.",
        instructions: "Não é conteúdo público.",
        question: "Qual é a opção de teste?",
        answerOptions: [
          { id: "a", text: "Opção A" },
          { id: "b", text: "Opção B" },
        ] as Prisma.InputJsonValue,
        correctAnswer: "a",
        explanation: "Explicação privada de teste.",
        difficulty: MissionDifficulty.EASY,
        points: 1,
        order: 999,
        published: false,
      },
    });
  });

  after(async () => {
    await prisma.mission.deleteMany({ where: { slug: hiddenMissionSlug } });
    if (hiddenModuleId) {
      await prisma.learningModule.deleteMany({ where: { id: hiddenModuleId } });
    }
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

  test("1. returns 401 for unauthenticated student endpoints", async () => {
    for (const path of [
      "/students/me",
      "/students/me/progress",
      "/modules",
      "/diagnostic",
    ]) {
      const response = await get(path);
      assert.equal(response.status, 401, `${path} should require authentication`);
    }
  });

  test("2. does not grant instructors or admins student data access", async () => {
    for (const cookie of [instructorCookie, adminCookie]) {
      for (const path of ["/students/me", "/students/me/progress", "/modules"]) {
        const response = await get(path, cookie);
        assert.equal(response.status, 403, `${path} should require STUDENT`);
      }
    }
  });

  test("3. creates and returns only the authenticated student's basic profile", async () => {
    const response = await get("/students/me", studentCookie);
    assert.equal(response.status, 200);
    const profile = (await response.json()) as StudentProfile &
      Record<string, unknown>;
    assert.equal(profile.name, "Estudante de teste");
    assert.equal(profile.email, studentEmail);
    assert.equal(profile.learningLevel, "BEGINNER");
    assert.equal(profile.diagnosticCompleted, false);
    assert.equal("role" in profile, false);
    assert.equal("userId" in profile, false);
    assert.equal("passwordHash" in profile, false);
  });

  test("4. updates only the display name and cannot change role or learning level", async () => {
    const update = await patchJson(
      "/students/me",
      { name: "Nome atualizado" },
      studentCookie,
    );
    assert.equal(update.status, 200);
    const escalation = await patchJson(
      "/students/me",
      {
        role: "ADMIN",
        userId: "another-user",
        learningLevel: "INTERMEDIATE",
      },
      studentCookie,
    );
    assert.equal(escalation.status, 400);

    const authResponse = await get("/auth/me", studentCookie);
    assert.equal(authResponse.status, 200);
    const authUser = (await authResponse.json()) as AuthUser;
    assert.equal(authUser.role, "STUDENT");

    const profileResponse = await get("/students/me", studentCookie);
    const profile = (await profileResponse.json()) as StudentProfile;
    assert.equal(profile.learningLevel, "BEGINNER");
    assert.equal(profile.name, "Nome atualizado");
    assert.equal(profile.email, studentEmail);
  });

  test("5. lists the three published modules with only this student's progress", async () => {
    const response = await get("/modules", studentCookie);
    assert.equal(response.status, 200);
    const modules = (await response.json()) as {
      slug: string;
      progress: { completedMissions: number; pointsEarned: number };
    }[];
    assert.deepEqual(
      modules.map((module) => module.slug),
      [
        "fundamentos-ciberseguranca",
        "redes-seguranca-web",
        "phishing-engenharia-social",
      ],
    );
    assert.ok(modules.every((module) => module.progress.completedMissions === 0));
    assert.ok(modules.every((module) => module.progress.pointsEarned === 0));
  });

  test("6. excludes unpublished modules and missions", async () => {
    const modulesResponse = await get("/modules", studentCookie);
    const modules = (await modulesResponse.json()) as { slug: string }[];
    assert.equal(modules.some((module) => module.slug === hiddenSlug), false);

    const missionsResponse = await get(
      "/modules/fundamentos-ciberseguranca/missions",
      studentCookie,
    );
    assert.equal(missionsResponse.status, 200);
    const missions = (await missionsResponse.json()) as { slug: string }[];
    assert.equal(
      missions.some((mission) => mission.slug === hiddenMissionSlug),
      false,
    );
  });

  test("7. rejects nonexistent and unpublished modules and missions", async () => {
    const hiddenMission = await prisma.mission.findUniqueOrThrow({
      where: { slug: hiddenMissionSlug },
      select: { id: true },
    });
    for (const path of [
      `/modules/${hiddenSlug}`,
      `/modules/${hiddenSlug}/missions`,
      "/modules/not-a-real-module",
      `/missions/${hiddenMission.id}`,
      "/missions/not-a-real-mission",
    ]) {
      const response = await get(path, studentCookie);
      assert.equal(response.status, 404, `${path} should not be accessible`);
    }
  });

  test("8. returns a published module and its missions", async () => {
    const moduleResponse = await get(
      "/modules/fundamentos-ciberseguranca",
      studentCookie,
    );
    assert.equal(moduleResponse.status, 200);
    const module = (await moduleResponse.json()) as {
      title: string;
      missionCount: number;
    };
    assert.equal(module.title, "Fundamentos de Cibersegurança");
    assert.equal(module.missionCount, 4);

    const missionsResponse = await get(
      "/modules/fundamentos-ciberseguranca/missions",
      studentCookie,
    );
    assert.equal(missionsResponse.status, 200);
    const missions = (await missionsResponse.json()) as unknown[];
    assert.equal(missions.length, 4);
  });

  test("9. hides a mission's correct answer and explanation before submission", async () => {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { slug: "distinguir-http-https" },
      select: { id: true },
    });
    const response = await get(`/missions/${mission.id}`, studentCookie);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      answerOptions: unknown[];
    } & Record<string, unknown>;
    assert.equal("correctAnswer" in body, false);
    assert.equal("explanation" in body, false);
    assert.equal("passwordHash" in body, false);
    assert.ok(Array.isArray(body.answerOptions));
  });

  test("10. rejects an answer that is not one of the published options", async () => {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { slug: "distinguir-http-https" },
      select: { id: true },
    });
    const response = await postJson(
      `/missions/${mission.id}/attempts`,
      { submittedAnswer: "not-an-option" },
      studentCookie,
    );
    assert.equal(response.status, 400);
    const history = await get(`/missions/${mission.id}/attempts`, studentCookie);
    assert.deepEqual(await history.json(), []);
  });

  test("11. records an incorrect answer with zero points and feedback", async () => {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { slug: "distinguir-http-https" },
      select: { id: true, correctAnswer: true, points: true },
    });
    const wrongOptionId = mission.correctAnswer === "a" ? "b" : "a";
    const response = await postJson(
      `/missions/${mission.id}/attempts`,
      { submittedAnswer: wrongOptionId },
      studentCookie,
    );
    assert.equal(response.status, 201);
    const attempt = (await response.json()) as MissionAttemptResult &
      Record<string, unknown>;
    assert.equal(attempt.isCorrect, false);
    assert.equal(attempt.score, 0);
    assert.equal(attempt.maxScore, mission.points);
    assert.equal(attempt.attemptNumber, 1);
    assert.ok(attempt.feedback.length > 0);
    assert.ok(attempt.explanation.length > 0);
    assert.equal("passwordHash" in attempt, false);
  });

  test("12. scores a correct retry using the mission's configured points", async () => {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { slug: "distinguir-http-https" },
      select: { id: true, correctAnswer: true, points: true },
    });
    const response = await postJson(
      `/missions/${mission.id}/attempts`,
      { submittedAnswer: mission.correctAnswer },
      studentCookie,
    );
    assert.equal(response.status, 201);
    const attempt = (await response.json()) as MissionAttemptResult;
    assert.equal(attempt.isCorrect, true);
    assert.equal(attempt.score, mission.points);
    assert.equal(attempt.maxScore, mission.points);
    assert.equal(attempt.attemptNumber, 2);
  });

  test("13. keeps attempt history private to each student", async () => {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { slug: "distinguir-http-https" },
      select: { id: true },
    });
    const ownHistory = await get(
      `/missions/${mission.id}/attempts`,
      studentCookie,
    );
    const otherHistory = await get(
      `/missions/${mission.id}/attempts`,
      secondStudentCookie,
    );
    assert.equal(ownHistory.status, 200);
    assert.equal(otherHistory.status, 200);
    assert.equal(
      ((await ownHistory.json()) as MissionAttemptRecord[]).length,
      2,
    );
    assert.deepEqual(await otherHistory.json(), []);
  });

  test("14. progress counts the best score once, not the sum of retries", async () => {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { slug: "distinguir-http-https" },
      select: { id: true, correctAnswer: true, points: true },
    });
    const retry = await postJson(
      `/missions/${mission.id}/attempts`,
      { submittedAnswer: mission.correctAnswer },
      studentCookie,
    );
    assert.equal(retry.status, 201);
    const moduleResponse = await get("/modules", studentCookie);
    const modules = (await moduleResponse.json()) as {
      slug: string;
      progress: { completedMissions: number; pointsEarned: number };
    }[];
    const networkModule = modules.find(
      (module) => module.slug === "redes-seguranca-web",
    )!;
    assert.equal(networkModule.progress.completedMissions, 1);
    assert.equal(networkModule.progress.pointsEarned, mission.points);
  });

  test("15. re-running seed does not duplicate the published modules or missions", async () => {
    const countsBefore = {
      modules: await prisma.learningModule.count({ where: { published: true } }),
      missions: await prisma.mission.count({ where: { published: true } }),
    };
    assert.deepEqual(countsBefore, { modules: 3, missions: 12 });

    await runSeed();
    await runSeed();

    const countsAfter = {
      modules: await prisma.learningModule.count({ where: { published: true } }),
      missions: await prisma.mission.count({ where: { published: true } }),
    };
    assert.deepEqual(countsAfter, countsBefore);
  });

  test("16. GET /diagnostic returns ten questions without answer keys", async () => {
    const response = await get("/diagnostic", studentCookie);
    assert.equal(response.status, 200);
    const body = (await response.json()) as DiagnosticQuestionsResponse &
      Record<string, unknown>;
    assert.equal(body.totalQuestions, 10);
    assert.equal(body.questions.length, 10);
    assert.equal("correctAnswer" in body, false);
    assert.equal(
      body.questions.some(
        (question) =>
          Object.hasOwn(question, "correctOptionId") ||
          Object.hasOwn(question, "explanation"),
      ),
      false,
    );
    assert.equal("passwordHash" in body, false);
  });

  test("17. rejects incomplete and invalid diagnostic submissions", async () => {
    const incomplete = await postJson(
      "/diagnostic/submit",
      { answers: [] },
      studentCookie,
    );
    assert.equal(incomplete.status, 400);

    const answers = await diagnosticAnswers(10);
    answers[0]!.selectedOptionId = "not-an-option";
    const invalidOption = await postJson(
      "/diagnostic/submit",
      { answers },
      studentCookie,
    );
    assert.equal(invalidOption.status, 400);

    const profileResponse = await get("/students/me", studentCookie);
    const profile = (await profileResponse.json()) as StudentProfile;
    assert.equal(profile.diagnosticCompleted, false);
  });

  test("18. classifies 40%, 50%, and 80% on the server and preserves repeats", async () => {
    const expected = [
      { correct: 4, score: 40, level: "BEGINNER", module: "fundamentos-ciberseguranca" },
      { correct: 5, score: 50, level: "ELEMENTARY", module: "redes-seguranca-web" },
      { correct: 8, score: 80, level: "INTERMEDIATE", module: "phishing-engenharia-social" },
    ];
    const resultIds: string[] = [];
    for (const item of expected) {
      const response = await postJson(
        "/diagnostic/submit",
        { answers: await diagnosticAnswers(item.correct) },
        studentCookie,
      );
      assert.equal(response.status, 201);
      const result = (await response.json()) as DiagnosticResultResponse;
      assert.equal(result.score, item.score);
      assert.equal(result.correctAnswers, item.correct);
      assert.equal(result.totalQuestions, 10);
      assert.equal(result.learningLevel, item.level);
      assert.equal(result.recommendedModule.slug, item.module);
      assert.equal("answers" in result, false);
      assert.equal("passwordHash" in result, false);
      resultIds.push(result.attemptId);
    }
    assert.equal(new Set(resultIds).size, 3);
  });

  test("19. latest diagnostic determines the profile and all results remain in history", async () => {
    const profileResponse = await get("/students/me", studentCookie);
    const profile = (await profileResponse.json()) as StudentProfile;
    assert.equal(profile.learningLevel, "INTERMEDIATE");
    assert.equal(profile.diagnosticCompleted, true);

    const progressResponse = await get("/students/me/progress", studentCookie);
    assert.equal(progressResponse.status, 200);
    const progress = (await progressResponse.json()) as StudentProgressResponse;
    assert.equal(progress.learningLevel, "INTERMEDIATE");
    assert.equal(progress.diagnosticHistory.length, 3);
    assert.deepEqual(
      progress.diagnosticHistory.map(
        (entry: { score: number }) => entry.score,
      ),
      [80, 50, 40],
    );
    assert.ok(
      progress.diagnosticHistory.every(
        (entry) =>
          !Object.hasOwn(entry, "answers") &&
          !Object.hasOwn(entry, "passwordHash"),
      ),
    );
  });

  test("20. learning responses never include password hashes", async () => {
    const responses = await Promise.all([
      get("/students/me", studentCookie),
      get("/modules", studentCookie),
      get("/students/me/progress", studentCookie),
      get("/diagnostic", studentCookie),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(
        JSON.stringify(await response.json()).includes("passwordHash"),
        false,
      );
    }
  });
});
