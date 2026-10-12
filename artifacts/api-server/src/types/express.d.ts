import type { AuthUser } from "@workspace/api-zod";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
