import { Router, type IRouter } from "express";
import { rateLimit } from "express-rate-limit";
import {
  GetAuthMeResponse,
  LoginAuthUserBody,
  LoginAuthUserResponse,
  RegisterAuthUserBody,
  RegisterAuthUserResponse,
} from "@workspace/api-zod";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middlewares/auth";
import { requireTrustedOrigin } from "../middlewares/trusted-origin";
import {
  clearSessionCookie,
  invalidateSession,
  invalidPasswordLength,
  loginUser,
  normalizeEmail,
  registerStudent,
  setSessionCookie,
  toAuthUser,
} from "../services/auth";
import { HttpError } from "../utils/http-error";

const router: IRouter = Router();

function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === "test" ? 100 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        error: "Demasiadas tentativas. Aguarde antes de tentar novamente.",
      });
    },
  });
}

const registerLimiter = createAuthLimiter();
const loginLimiter = createAuthLimiter();

function normalizedBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const record = body as Record<string, unknown>;
  return typeof record.email === "string"
    ? { ...record, email: normalizeEmail(record.email) }
    : record;
}

function registrationValidationMessage(field: unknown): string {
  if (field === "name") {
    return "Indique o seu nome.";
  }
  if (field === "email") {
    return "Indique um endereço de e-mail válido.";
  }
  if (field === "password") {
    return "A palavra-passe deve ter pelo menos 8 caracteres.";
  }
  return "Verifique os campos do formulário.";
}

router.post(
  "/auth/register",
  registerLimiter,
  requireTrustedOrigin,
  async (request, response) => {
    const input = RegisterAuthUserBody.safeParse(normalizedBody(request.body));
    if (!input.success) {
      throw new HttpError(
        400,
        registrationValidationMessage(input.error.issues[0]?.path[0]),
      );
    }

    const name = input.data.name.trim();
    if (!name) {
      throw new HttpError(400, "Indique o seu nome.");
    }
    if (invalidPasswordLength(input.data.password)) {
      throw new HttpError(400, "A palavra-passe excede o tamanho permitido.");
    }

    const session = await registerStudent(
      name,
      input.data.email,
      input.data.password,
    );
    setSessionCookie(response, session.token, session.expiresAt);
    response
      .status(201)
      .json(RegisterAuthUserResponse.parse(toAuthUser(session.user)));
  },
);

router.post(
  "/auth/login",
  loginLimiter,
  requireTrustedOrigin,
  async (request, response) => {
    const input = LoginAuthUserBody.safeParse(normalizedBody(request.body));
    if (!input.success) {
      throw new HttpError(
        400,
        registrationValidationMessage(input.error.issues[0]?.path[0]),
      );
    }
    if (invalidPasswordLength(input.data.password)) {
      throw new HttpError(400, "A palavra-passe excede o tamanho permitido.");
    }

    const session = await loginUser(input.data.email, input.data.password);
    setSessionCookie(response, session.token, session.expiresAt);
    response.json(LoginAuthUserResponse.parse(toAuthUser(session.user)));
  },
);

router.get("/auth/me", requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.authUser!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    response.status(401).json({ error: "Inicie sessão para continuar." });
    return;
  }

  response.json(GetAuthMeResponse.parse(toAuthUser(user)));
});

router.post("/auth/logout", requireTrustedOrigin, async (request, response) => {
  await invalidateSession(request);
  clearSessionCookie(response);
  response.status(204).end();
});

export default router;
