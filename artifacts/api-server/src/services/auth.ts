import { createHmac, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma, UserRole, type User } from "@prisma/client";
import type { AuthUser } from "@workspace/api-zod";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

const BCRYPT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = "cyberlab_session";
const DUMMY_PASSWORD_HASH = bcrypt.hash("cyberlab-invalid-login-dummy", BCRYPT_ROUNDS);

type PublicUserRecord = Pick<User, "id" | "name" | "email" | "role">;

export function toAuthUser(user: PublicUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashSessionToken(token: string): string {
  return createHmac("sha256", env.sessionSecret).update(token).digest("hex");
}

export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0 || item.slice(0, separator).trim() !== SESSION_COOKIE_NAME) {
      continue;
    }

    const token = item.slice(separator + 1).trim();
    return token.length > 0 ? token : null;
  }

  return null;
}

function makeSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export function setSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
): void {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${maxAge}`,
  ];

  if (env.nodeEnv === "production") {
    attributes.push("Secure");
  }

  response.append("Set-Cookie", attributes.join("; "));
}

export function clearSessionCookie(response: Response): void {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ];

  if (env.nodeEnv === "production") {
    attributes.push("Secure");
  }

  response.append("Set-Cookie", attributes.join("; "));
}

export async function registerStudent(
  name: string,
  email: string,
  password: string,
): Promise<{ user: PublicUserRecord; token: string; expiresAt: Date }> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    throw new HttpError(409, "Já existe uma conta com este endereço de e-mail.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const token = makeSessionToken();
  const expiresAt = sessionExpiry();

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.STUDENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      await transaction.session.create({
        data: {
          tokenHash: hashSessionToken(token),
          userId: createdUser.id,
          expiresAt,
        },
      });

      return createdUser;
    });

    return { user, token, expiresAt };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(409, "Já existe uma conta com este endereço de e-mail.");
    }

    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: PublicUserRecord; token: string; expiresAt: Date }> {
  const storedUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });
  const passwordHash = storedUser?.passwordHash ?? (await DUMMY_PASSWORD_HASH);
  const matches = await bcrypt.compare(password, passwordHash);

  if (!storedUser || !matches) {
    throw new HttpError(
      401,
      "Credenciais inválidas. Verifique o e-mail e a palavra-passe.",
    );
  }

  const token = makeSessionToken();
  const expiresAt = sessionExpiry();
  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: storedUser.id,
      expiresAt,
    },
  });

  const { passwordHash: _passwordHash, ...user } = storedUser;
  return { user, token, expiresAt };
}

export async function invalidateSession(request: Request): Promise<void> {
  const token = readSessionToken(request);
  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export function invalidPasswordLength(password: string): boolean {
  return Buffer.byteLength(password, "utf8") > 72;
}
