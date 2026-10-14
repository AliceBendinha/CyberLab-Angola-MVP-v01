import type { DiagnosticAnswerInput } from "@workspace/api-zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  evaluateDiagnostic,
  getPublicDiagnostic,
  recommendedModuleForLevel,
} from "./diagnostic";
import { HttpError } from "../utils/http-error";

type PublicOption = { id: string; text: string };
type StudentMissionAttempt = {
  score: number;
  isCorrect: boolean;
  completedAt: Date;
};

function readOptions(value: Prisma.JsonValue): PublicOption[] {
  if (!Array.isArray(value)) {
    throw new Error("Stored mission options are invalid.");
  }

  const options = value.map((item) => {
    if (
      item === null ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      typeof item.id !== "string" ||
      typeof item.text !== "string"
    ) {
      throw new Error("Stored mission options are invalid.");
    }

    return { id: item.id, text: item.text };
  });

  if (options.length < 2 || new Set(options.map(({ id }) => id)).size !== options.length) {
    throw new Error("Stored mission options are invalid.");
  }

  return options;
}

function bestScore(
  attempts: StudentMissionAttempt[],
  points: number,
): number | null {
  if (attempts.length === 0) {
    return null;
  }
  return Math.min(points, Math.max(0, ...attempts.map((attempt) => attempt.score)));
}

function latestAttemptAt(attempts: StudentMissionAttempt[]): Date | null {
  if (attempts.length === 0) {
    return null;
  }
  return attempts.reduce(
    (latest, attempt) =>
      attempt.completedAt > latest ? attempt.completedAt : latest,
    attempts[0]!.completedAt,
  );
}

function toMissionSummary<
  T extends {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    points: number;
    order: number;
    attempts: StudentMissionAttempt[];
  },
>(mission: T) {
  return {
    id: mission.id,
    title: mission.title,
    slug: mission.slug,
    description: mission.description,
    difficulty: mission.difficulty,
    points: mission.points,
    order: mission.order,
    attemptCount: mission.attempts.length,
    isCompleted: mission.attempts.some((attempt) => attempt.isCorrect),
    bestScore: bestScore(mission.attempts, mission.points),
    lastAttemptAt: latestAttemptAt(mission.attempts),
  };
}

async function getPublishedModulesWithAttempts(userId: string) {
  return prisma.learningModule.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { slug: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      order: true,
      missions: {
        where: { published: true },
        orderBy: [{ order: "asc" }, { slug: "asc" }],
        select: {
          id: true,
          points: true,
          attempts: {
            where: { userId },
            select: { score: true, isCorrect: true, completedAt: true },
          },
        },
      },
    },
  });
}

function toModuleProgress(
  missions: {
    points: number;
    attempts: StudentMissionAttempt[];
  }[],
) {
  const completedMissions = missions.filter((mission) =>
    mission.attempts.some((attempt) => attempt.isCorrect),
  ).length;
  const pointsAvailable = missions.reduce(
    (sum, mission) => sum + mission.points,
    0,
  );
  const pointsEarned = missions.reduce(
    (sum, mission) => sum + (bestScore(mission.attempts, mission.points) ?? 0),
    0,
  );
  const totalMissions = missions.length;
  const latestActivity = missions
    .map((mission) => latestAttemptAt(mission.attempts))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

  return {
    completedMissions,
    totalMissions,
    pointsEarned,
    pointsAvailable,
    completionPercent:
      totalMissions === 0
        ? 0
        : Math.round((completedMissions / totalMissions) * 100),
    lastActivityAt: latestActivity,
  };
}

function toModuleSummary(
  module: Awaited<ReturnType<typeof getPublishedModulesWithAttempts>>[number],
) {
  return {
    id: module.id,
    title: module.title,
    slug: module.slug,
    description: module.description,
    order: module.order,
    missionCount: module.missions.length,
    progress: toModuleProgress(module.missions),
  };
}

export async function getStudentProfile(userId: string) {
  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new HttpError(401, "Inicie sessão para continuar.");
  }

  return {
    id: profile.id,
    name: user.name,
    email: user.email,
    learningLevel: profile.learningLevel,
    diagnosticCompleted: profile.diagnosticCompleted,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function updateStudentName(userId: string, name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new HttpError(400, "Indique um nome de apresentação.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.studentProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await transaction.user.update({
      where: { id: userId },
      data: { name: normalizedName },
    });
  });

  return getStudentProfile(userId);
}

export async function listLearningModules(userId: string) {
  const modules = await getPublishedModulesWithAttempts(userId);
  return modules.map(toModuleSummary);
}

export async function getLearningModule(userId: string, slug: string) {
  const modules = await getPublishedModulesWithAttempts(userId);
  const module = modules.find((item) => item.slug === slug);
  if (!module) {
    throw new HttpError(404, "Módulo não encontrado.");
  }
  return toModuleSummary(module);
}

export async function listModuleMissions(userId: string, slug: string) {
  const module = await prisma.learningModule.findFirst({
    where: { slug, published: true },
    select: {
      missions: {
        where: { published: true },
        orderBy: [{ order: "asc" }, { slug: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          difficulty: true,
          points: true,
          order: true,
          attempts: {
            where: { userId },
            select: { score: true, isCorrect: true, completedAt: true },
          },
        },
      },
    },
  });

  if (!module) {
    throw new HttpError(404, "Módulo não encontrado.");
  }

  return module.missions.map(toMissionSummary);
}

export async function getLearningMission(userId: string, id: string) {
  const mission = await prisma.mission.findFirst({
    where: {
      id,
      published: true,
      module: { published: true },
    },
    select: {
      id: true,
      moduleId: true,
      title: true,
      slug: true,
      description: true,
      scenario: true,
      instructions: true,
      question: true,
      answerOptions: true,
      difficulty: true,
      points: true,
      order: true,
      attempts: {
        where: { userId },
        select: { score: true, isCorrect: true, completedAt: true },
      },
    },
  });

  if (!mission) {
    throw new HttpError(404, "Missão não encontrada.");
  }

  return {
    id: mission.id,
    moduleId: mission.moduleId,
    title: mission.title,
    slug: mission.slug,
    description: mission.description,
    scenario: mission.scenario,
    instructions: mission.instructions,
    question: mission.question,
    answerOptions: readOptions(mission.answerOptions),
    difficulty: mission.difficulty,
    points: mission.points,
    order: mission.order,
    attemptCount: mission.attempts.length,
    isCompleted: mission.attempts.some((attempt) => attempt.isCorrect),
    bestScore: bestScore(mission.attempts, mission.points),
  };
}

async function findPublishedMission(id: string) {
  const mission = await prisma.mission.findFirst({
    where: {
      id,
      published: true,
      module: { published: true },
    },
    select: {
      id: true,
      title: true,
      points: true,
      answerOptions: true,
      correctAnswer: true,
      explanation: true,
    },
  });
  if (!mission) {
    throw new HttpError(404, "Missão não encontrada.");
  }
  return mission;
}

function answerText(options: PublicOption[], answerId: string): string {
  return options.find((option) => option.id === answerId)?.text ?? "Opção indisponível";
}

export async function createMissionAttempt(
  userId: string,
  missionId: string,
  submittedAnswer: string,
) {
  const mission = await findPublishedMission(missionId);
  const options = readOptions(mission.answerOptions);
  const selectedOption = options.find((option) => option.id === submittedAnswer);
  if (!selectedOption) {
    throw new HttpError(400, "Escolha uma das opções apresentadas.");
  }

  const isCorrect = submittedAnswer === mission.correctAnswer;
  const completedAt = new Date();
  const startedAt = completedAt;

  let attempt;
  try {
    attempt = await prisma.$transaction(
      async (transaction) => {
        const latest = await transaction.missionAttempt.aggregate({
          where: { userId, missionId },
          _max: { attemptNumber: true },
        });
        const attemptNumber = (latest._max.attemptNumber ?? 0) + 1;
        return transaction.missionAttempt.create({
          data: {
            userId,
            missionId,
            submittedAnswer,
            isCorrect,
            score: isCorrect ? mission.points : 0,
            attemptNumber,
            startedAt,
            completedAt,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      throw new HttpError(
        409,
        "A tentativa foi submetida em simultâneo. Atualize o histórico e tente novamente.",
      );
    }
    throw error;
  }

  return {
    id: attempt.id,
    missionId,
    submittedAnswerText: selectedOption.text,
    isCorrect,
    score: attempt.score,
    maxScore: mission.points,
    attemptNumber: attempt.attemptNumber,
    feedback: isCorrect
      ? `Resposta correta. Obtiveste ${attempt.score} de ${mission.points} pontos nesta tentativa.`
      : "Esta opção não corresponde ao critério da missão. Revê os sinais do cenário e tenta novamente.",
    explanation: mission.explanation,
    completedAt: attempt.completedAt,
  };
}

export async function listMissionAttempts(userId: string, missionId: string) {
  const mission = await findPublishedMission(missionId);
  const attempts = await prisma.missionAttempt.findMany({
    where: { userId, missionId },
    orderBy: [{ attemptNumber: "asc" }],
    select: {
      id: true,
      missionId: true,
      submittedAnswer: true,
      isCorrect: true,
      score: true,
      attemptNumber: true,
      startedAt: true,
      completedAt: true,
    },
  });
  const options = readOptions(mission.answerOptions);

  return attempts.map((attempt) => ({
    id: attempt.id,
    missionId: attempt.missionId,
    missionTitle: mission.title,
    submittedAnswerText: answerText(options, attempt.submittedAnswer),
    isCorrect: attempt.isCorrect,
    score: attempt.score,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
  }));
}

async function ensureStudentProfile(userId: string) {
  return prisma.studentProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { learningLevel: true },
  });
}

export async function getStudentProgress(userId: string) {
  const [profile, modules] = await Promise.all([
    ensureStudentProfile(userId),
    getPublishedModulesWithAttempts(userId),
  ]);

  const moduleSummaries = modules.map(toModuleSummary);
  const totalMissions = moduleSummaries.reduce(
    (sum, module) => sum + module.progress.totalMissions,
    0,
  );
  const completedMissions = moduleSummaries.reduce(
    (sum, module) => sum + module.progress.completedMissions,
    0,
  );
  const pointsEarned = moduleSummaries.reduce(
    (sum, module) => sum + module.progress.pointsEarned,
    0,
  );
  const pointsAvailable = moduleSummaries.reduce(
    (sum, module) => sum + module.progress.pointsAvailable,
    0,
  );
  const diagnostic = getPublicDiagnostic();

  const [recentAttempts, diagnosticAttempts] = await Promise.all([
    prisma.missionAttempt.findMany({
      where: {
        userId,
        mission: { published: true, module: { published: true } },
      },
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      take: 20,
      select: {
        id: true,
        missionId: true,
        submittedAnswer: true,
        isCorrect: true,
        score: true,
        attemptNumber: true,
        startedAt: true,
        completedAt: true,
        mission: {
          select: { title: true, answerOptions: true },
        },
      },
    }),
    prisma.diagnosticAttempt.findMany({
      where: { userId },
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        score: true,
        learningLevel: true,
        completedAt: true,
      },
    }),
  ]);

  return {
    learningLevel: profile.learningLevel,
    completedMissions,
    totalMissions,
    pointsEarned,
    pointsAvailable,
    completionPercent:
      totalMissions === 0
        ? 0
        : Math.round((completedMissions / totalMissions) * 100),
    modules: moduleSummaries,
    recentAttempts: recentAttempts.map((attempt) => ({
      id: attempt.id,
      missionId: attempt.missionId,
      missionTitle: attempt.mission.title,
      submittedAnswerText: answerText(
        readOptions(attempt.mission.answerOptions),
        attempt.submittedAnswer,
      ),
      isCorrect: attempt.isCorrect,
      score: attempt.score,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    })),
    diagnosticHistory: diagnosticAttempts.map((attempt) => ({
      attemptId: attempt.id,
      score: attempt.score,
      learningLevel: attempt.learningLevel,
      correctAnswers: Math.round(
        (attempt.score / 100) * diagnostic.totalQuestions,
      ),
      totalQuestions: diagnostic.totalQuestions,
      completedAt: attempt.completedAt,
      recommendedModule: recommendedModuleForLevel(attempt.learningLevel),
    })),
  };
}

export async function submitDiagnostic(
  userId: string,
  answers: DiagnosticAnswerInput[],
) {
  const evaluation = evaluateDiagnostic(answers);
  const completedAt = new Date();
  const attempt = await prisma.$transaction(async (transaction) => {
    const createdAttempt = await transaction.diagnosticAttempt.create({
      data: {
        userId,
        answers: answers as unknown as Prisma.InputJsonValue,
        score: evaluation.score,
        learningLevel: evaluation.learningLevel,
        completedAt,
      },
      select: {
        id: true,
        score: true,
        learningLevel: true,
        completedAt: true,
      },
    });
    await transaction.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        diagnosticCompleted: true,
        learningLevel: evaluation.learningLevel,
      },
      update: {
        diagnosticCompleted: true,
        learningLevel: evaluation.learningLevel,
      },
    });
    return createdAttempt;
  });

  return {
    attemptId: attempt.id,
    score: attempt.score,
    correctAnswers: evaluation.correctAnswers,
    totalQuestions: evaluation.totalQuestions,
    learningLevel: attempt.learningLevel,
    completedAt: attempt.completedAt,
    recommendedModule: evaluation.recommendedModule,
  };
}
