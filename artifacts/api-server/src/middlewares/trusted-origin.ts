import type { Request, RequestHandler } from "express";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

export function isAllowedOrigin(request: Request, origin: string): boolean {
  if (env.corsOrigins.includes(origin)) {
    return true;
  }

  const forwardedHost = request.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || request.get("host");
  if (!requestHost) {
    return false;
  }

  try {
    return (
      new URL(origin).origin ===
      new URL(`${request.protocol}://${requestHost}`).origin
    );
  } catch {
    return false;
  }
}

export const requireTrustedOrigin: RequestHandler = (request, _response, next) => {
  const origin = request.get("origin");
  if (!origin || !isAllowedOrigin(request, origin)) {
    next(new HttpError(403, "A origem deste pedido não é permitida."));
    return;
  }

  next();
};
