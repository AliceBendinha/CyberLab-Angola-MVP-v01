import { LearningLevel, type DiagnosticAnswerInput } from "@workspace/api-zod";
import type { LearningLevel as PrismaLearningLevel } from "@prisma/client";

type DiagnosticOption = {
  id: string;
  text: string;
};

type DiagnosticQuestion = {
  id: string;
  topic: string;
  question: string;
  options: DiagnosticOption[];
  correctOptionId: string;
};

const questions: DiagnosticQuestion[] = [
  {
    id: "cia-availability",
    topic: "Fundamentos",
    question:
      "Um portal fictício de uma escola fica indisponível depois de uma falha. Que medida ajuda mais a recuperar o serviço?",
    options: [
      { id: "a", text: "Manter cópias de segurança testadas e um plano de recuperação." },
      { id: "b", text: "Partilhar a palavra-passe de administração com todos os alunos." },
      { id: "c", text: "Desativar os registos para poupar espaço." },
      { id: "d", text: "Usar a mesma conta em todos os computadores." },
    ],
    correctOptionId: "a",
  },
  {
    id: "https-transport",
    topic: "Redes e protocolos",
    question:
      "Ao abrir a página de um serviço escolar, o que indica HTTPS em vez de HTTP?",
    options: [
      { id: "a", text: "A ligação usa TLS para proteger os dados em trânsito." },
      { id: "b", text: "O site não pode conter erros nem conteúdo malicioso." },
      { id: "c", text: "A palavra-passe fica visível apenas para o administrador." },
      { id: "d", text: "O dispositivo deixa de precisar de atualizações." },
    ],
    correctOptionId: "a",
  },
  {
    id: "unique-passwords",
    topic: "Passwords e autenticação",
    question:
      "Qual é a prática mais segura para as contas de uma estudante que usa vários serviços?",
    options: [
      { id: "a", text: "Usar uma password curta igual em todos os serviços." },
      { id: "b", text: "Usar passwords únicas e longas e ativar MFA quando disponível." },
      { id: "c", text: "Enviar a password para si própria numa mensagem pública." },
      { id: "d", text: "Guardar todas as passwords num ficheiro sem proteção." },
    ],
    correctOptionId: "b",
  },
  {
    id: "phishing-signs",
    topic: "Phishing",
    question:
      "Uma mensagem fictícia diz que a conta do campus será bloqueada em dez minutos e pede para abrir um link num domínio inesperado terminado em .test. O que fazer?",
    options: [
      { id: "a", text: "Abrir o link depressa para evitar o bloqueio." },
      { id: "b", text: "Responder com a password para confirmar a identidade." },
      { id: "c", text: "Não abrir o link e confirmar o aviso por um canal oficial conhecido." },
      { id: "d", text: "Reencaminhar a mensagem para toda a turma." },
    ],
    correctOptionId: "c",
  },
  {
    id: "web-input-validation",
    topic: "Segurança web",
    question:
      "Uma aplicação recebe texto num formulário. Onde deve validar os dados antes de os guardar?",
    options: [
      { id: "a", text: "Apenas no navegador, porque o servidor recebe sempre dados seguros." },
      { id: "b", text: "No servidor, com validação e consultas parametrizadas à base de dados." },
      { id: "c", text: "Em lado nenhum, se o formulário tiver um botão de enviar." },
      { id: "d", text: "Só depois de publicar a aplicação." },
    ],
    correctOptionId: "b",
  },
  {
    id: "dns-purpose",
    topic: "Redes e protocolos",
    question: "Qual é a função principal do DNS numa rede?",
    options: [
      { id: "a", text: "Traduzir nomes de domínio em endereços usados na rede." },
      { id: "b", text: "Encriptar automaticamente todos os ficheiros do computador." },
      { id: "c", text: "Substituir a autenticação das contas." },
      { id: "d", text: "Garantir que qualquer site é legítimo." },
    ],
    correctOptionId: "a",
  },
  {
    id: "mfa-code",
    topic: "Passwords e autenticação",
    question:
      "Uma pessoa que afirma ser do suporte pede o código temporário de MFA por mensagem. Qual é a melhor resposta?",
    options: [
      { id: "a", text: "Enviar o código, porque expira rapidamente." },
      { id: "b", text: "Partilhar apenas metade do código." },
      { id: "c", text: "Não partilhar o código e verificar o pedido por um canal oficial." },
      { id: "d", text: "Desativar a MFA para evitar novos pedidos." },
    ],
    correctOptionId: "c",
  },
  {
    id: "shared-session",
    topic: "Sessões e dispositivos",
    question:
      "Depois de consultar um trabalho num computador partilhado da biblioteca, o que deve fazer a estudante?",
    options: [
      { id: "a", text: "Fechar apenas a janela e deixar a conta iniciada." },
      { id: "b", text: "Terminar a sessão e confirmar que a conta saiu antes de se afastar." },
      { id: "c", text: "Guardar a password no navegador para a próxima pessoa." },
      { id: "d", text: "Deixar o ecrã aberto para não perder o trabalho." },
    ],
    correctOptionId: "b",
  },
  {
    id: "public-wifi",
    topic: "Redes e práticas seguras",
    question:
      "Num ponto de acesso Wi-Fi público com nome parecido ao da escola, qual é a decisão mais prudente antes de aceder a uma conta?",
    options: [
      { id: "a", text: "Confirmar a rede com a escola e preferir uma ligação de confiança para tarefas sensíveis." },
      { id: "b", text: "Usar a rede sem confirmar, desde que o sinal seja forte." },
      { id: "c", text: "Desativar HTTPS para a página carregar mais depressa." },
      { id: "d", text: "Partilhar a ligação e a password da conta com colegas desconhecidos." },
    ],
    correctOptionId: "a",
  },
  {
    id: "auth-log",
    topic: "Registos e resposta",
    question:
      "Um registo fictício mostra várias tentativas de autenticação falhadas numa conta que não reconheces. Qual deve ser o próximo passo?",
    options: [
      { id: "a", text: "Tentar ligar ao endereço de origem para investigar por conta própria." },
      { id: "b", text: "Ignorar o registo porque as tentativas falharam." },
      { id: "c", text: "Comunicar o evento ao responsável autorizado e seguir o processo da escola." },
      { id: "d", text: "Publicar o registo completo nas redes sociais." },
    ],
    correctOptionId: "c",
  },
];

const recommendations: Record<
  PrismaLearningLevel,
  { slug: string; title: string }
> = {
  BEGINNER: {
    slug: "fundamentos-ciberseguranca",
    title: "Fundamentos de Cibersegurança",
  },
  ELEMENTARY: {
    slug: "redes-seguranca-web",
    title: "Redes e Segurança Web",
  },
  INTERMEDIATE: {
    slug: "phishing-engenharia-social",
    title: "Phishing e Engenharia Social",
  },
};

export function getPublicDiagnostic() {
  return {
    title: "Diagnóstico inicial de aprendizagem",
    introduction:
      "Este exercício estima por onde começar. Não é uma certificação profissional nem uma prova definitiva da tua competência.",
    totalQuestions: questions.length,
    questions: questions.map(({ id, topic, question, options }) => ({
      id,
      topic,
      question,
      options,
    })),
  };
}

export function evaluateDiagnostic(
  answers: DiagnosticAnswerInput[],
): {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  learningLevel: PrismaLearningLevel;
  recommendedModule: { slug: string; title: string };
} {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const correctAnswers = answers.reduce((count, answer) => {
    return count + Number(questionById.get(answer.questionId)?.correctOptionId === answer.selectedOptionId);
  }, 0);
  const score = Math.round((correctAnswers / questions.length) * 100);
  const learningLevel =
    score >= 80
      ? LearningLevel.INTERMEDIATE
      : score >= 50
        ? LearningLevel.ELEMENTARY
        : LearningLevel.BEGINNER;

  return {
    score,
    correctAnswers,
    totalQuestions: questions.length,
    learningLevel,
    recommendedModule: recommendations[learningLevel],
  };
}

export function validateDiagnosticAnswers(
  answers: DiagnosticAnswerInput[],
): boolean {
  if (answers.length !== questions.length) {
    return false;
  }

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set<string>();
  for (const answer of answers) {
    const question = questionById.get(answer.questionId);
    if (
      !question ||
      seen.has(answer.questionId) ||
      !question.options.some((option) => option.id === answer.selectedOptionId)
    ) {
      return false;
    }
    seen.add(answer.questionId);
  }

  return seen.size === questions.length;
}

export function recommendedModuleForLevel(level: PrismaLearningLevel) {
  return recommendations[level];
}
