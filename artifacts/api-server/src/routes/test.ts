import { Router, type IRouter } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/test/student",
  requireAuth,
  requireRole(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN),
  (_request, response) => {
    response.json({ ok: true });
  },
);

router.get(
  "/test/instructor",
  requireAuth,
  requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN),
  (_request, response) => {
    response.json({ ok: true });
  },
);

router.get(
  "/test/admin",
  requireAuth,
  requireRole(UserRole.ADMIN),
  (_request, response) => {
    response.json({ ok: true });
  },
);

export default router;
