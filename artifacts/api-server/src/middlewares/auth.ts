import { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { prisma } from "../config/prisma";
import { hashSessionToken, readSessionToken, toAuthUser } from "../services/auth";

function unauthenticated(response: Parameters<RequestHandler>[1]): void {
  response.status(401).json({ error: "Inicie sessão para continuar." });
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = readSessionToken(request);
  if (!token) {
    unauthenticated(response);
    return;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session) {
    unauthenticated(response);
    return;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    unauthenticated(response);
    return;
  }

  request.authUser = toAuthUser(session.user);
  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (request, response, next) => {
    if (!request.authUser) {
      unauthenticated(response);
      return;
    }

    if (!roles.includes(request.authUser.role as UserRole)) {
      response.status(403).json({
        error: "Não tem permissão para aceder a este recurso.",
      });
      return;
    }

    next();
  };
}
