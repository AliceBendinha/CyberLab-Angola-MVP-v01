import { UserRole } from "@prisma/client";
import { rateLimit } from "express-rate-limit";
import { Router, type IRouter } from "express";
import {
  GetInitialDiagnosticResponse,
  GetLearningMissionParams,
  GetLearningMissionResponse,
  GetLearningModuleParams,
  GetLearningModuleResponse,
  GetStudentMeResponse,
  GetStudentProgressResponse,
  ListLearningModulesResponse,
  ListMissionAttemptsParams,
  ListMissionAttemptsResponse,
  ListModuleMissionsParams,
  ListModuleMissionsResponse,
  SubmitInitialDiagnosticBody,
  SubmitInitialDiagnosticResponse,
  SubmitMissionAttemptBody,
  SubmitMissionAttemptParams,
  SubmitMissionAttemptResponse,
  UpdateStudentMeBody,
  UpdateStudentMeResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import { requireTrustedOrigin } from "../middlewares/trusted-origin";
import { HttpError } from "../utils/http-error";
import {
  createMissionAttempt,
  getLearningMission,
  getLearningModule,
  getStudentProfile,
  getStudentProgress,
  listLearningModules,
  listMissionAttempts,
  listModuleMissions,
  submitDiagnostic,
  updateStudentName,
} from "../services/learning";
import {
  getPublicDiagnostic,
  validateDiagnosticAnswers,
} from "../services/diagnostic";

const router: IRouter = Router();

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 100 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: "Demasiadas submissões. Aguarde antes de tentar novamente.",
    });
  },
});

const requireStudent = [requireAuth, requireRole(UserRole.STUDENT)];

router.get("/students/me", ...requireStudent, async (request, response) => {
  const profile = await getStudentProfile(request.authUser!.id);
  response.json(GetStudentMeResponse.parse(profile));
});

router.patch(
  "/students/me",
  ...requireStudent,
  requireTrustedOrigin,
  async (request, response) => {
    const input = UpdateStudentMeBody.safeParse(request.body);
    if (!input.success) {
      throw new HttpError(400, "Indique apenas um nome de apresentação válido.");
    }
    const profile = await updateStudentName(request.authUser!.id, input.data.name);
    response.json(UpdateStudentMeResponse.parse(profile));
  },
);

router.get("/modules", ...requireStudent, async (request, response) => {
  const modules = await listLearningModules(request.authUser!.id);
  response.json(ListLearningModulesResponse.parse(modules));
});

router.get(
  "/modules/:slug",
  ...requireStudent,
  async (request, response) => {
    const params = GetLearningModuleParams.safeParse(request.params);
    if (!params.success) {
      throw new HttpError(400, "O identificador do módulo é inválido.");
    }
    const module = await getLearningModule(
      request.authUser!.id,
      params.data.slug,
    );
    response.json(GetLearningModuleResponse.parse(module));
  },
);

router.get(
  "/modules/:slug/missions",
  ...requireStudent,
  async (request, response) => {
    const params = ListModuleMissionsParams.safeParse(request.params);
    if (!params.success) {
      throw new HttpError(400, "O identificador do módulo é inválido.");
    }
    const missions = await listModuleMissions(
      request.authUser!.id,
      params.data.slug,
    );
    response.json(ListModuleMissionsResponse.parse(missions));
  },
);

router.get(
  "/missions/:id",
  ...requireStudent,
  async (request, response) => {
    const params = GetLearningMissionParams.safeParse(request.params);
    if (!params.success) {
      throw new HttpError(400, "O identificador da missão é inválido.");
    }
    const mission = await getLearningMission(
      request.authUser!.id,
      params.data.id,
    );
    response.json(GetLearningMissionResponse.parse(mission));
  },
);

router.post(
  "/missions/:id/attempts",
  ...requireStudent,
  requireTrustedOrigin,
  submissionLimiter,
  async (request, response) => {
    const params = SubmitMissionAttemptParams.safeParse(request.params);
    const input = SubmitMissionAttemptBody.safeParse(request.body);
    if (!params.success || !input.success) {
      throw new HttpError(400, "Escolha uma resposta válida para a missão.");
    }
    const attempt = await createMissionAttempt(
      request.authUser!.id,
      params.data.id,
      input.data.submittedAnswer,
    );
    response
      .status(201)
      .json(SubmitMissionAttemptResponse.parse(attempt));
  },
);

router.get(
  "/missions/:id/attempts",
  ...requireStudent,
  async (request, response) => {
    const params = ListMissionAttemptsParams.safeParse(request.params);
    if (!params.success) {
      throw new HttpError(400, "O identificador da missão é inválido.");
    }
    const attempts = await listMissionAttempts(
      request.authUser!.id,
      params.data.id,
    );
    response.json(ListMissionAttemptsResponse.parse(attempts));
  },
);

router.get(
  "/students/me/progress",
  ...requireStudent,
  async (request, response) => {
    const progress = await getStudentProgress(request.authUser!.id);
    response.json(GetStudentProgressResponse.parse(progress));
  },
);

router.get(
  "/diagnostic",
  ...requireStudent,
  (_request, response) => {
    response.json(GetInitialDiagnosticResponse.parse(getPublicDiagnostic()));
  },
);

router.post(
  "/diagnostic/submit",
  ...requireStudent,
  requireTrustedOrigin,
  submissionLimiter,
  async (request, response) => {
    const input = SubmitInitialDiagnosticBody.safeParse(request.body);
    if (
      !input.success ||
      !validateDiagnosticAnswers(input.data.answers)
    ) {
      throw new HttpError(
        400,
        "Responde a cada pergunta uma única vez, usando uma das opções apresentadas.",
      );
    }

    const result = await submitDiagnostic(
      request.authUser!.id,
      input.data.answers,
    );
    response
      .status(201)
      .json(SubmitInitialDiagnosticResponse.parse(result));
  },
);

export default router;
