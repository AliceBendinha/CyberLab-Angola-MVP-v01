import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MissionDifficulty, Prisma, PrismaClient } from "@prisma/client";

const modules = [
  {
    title: "Fundamentos de Cibersegurança",
    slug: "fundamentos-ciberseguranca",
    description:
      "Princípios essenciais para proteger contas, dispositivos e informação no dia a dia.",
    order: 1,
    missions: [
      {
        title: "Recuperar um serviço escolar",
        slug: "recuperar-servico-escolar",
        description: "Escolhe uma medida que apoie a disponibilidade de um serviço.",
        scenario:
          "Um portal fictício de uma escola em Luanda fica indisponível depois de uma falha de energia. A equipa precisa de o recuperar sem perder os trabalhos guardados.",
        instructions:
          "Analisa as opções e escolhe a medida que melhor reduz o impacto de uma falha.",
        question: "Que medida deve ser priorizada?",
        answerOptions: [
          { id: "a", text: "Manter cópias de segurança testadas e um plano de recuperação." },
          { id: "b", text: "Partilhar a conta de administração com toda a turma." },
          { id: "c", text: "Desativar os registos para o portal responder mais depressa." },
          { id: "d", text: "Guardar a única cópia dos trabalhos num computador pessoal." },
        ],
        correctAnswer: "a",
        explanation:
          "Cópias de segurança verificadas e um plano de recuperação ajudam a restaurar a disponibilidade e reduzem a perda de informação. Partilhar contas ou manter uma única cópia aumenta o risco.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 1,
      },
      {
        title: "Aplicar o menor privilégio",
        slug: "aplicar-menor-privilegio",
        description: "Concede apenas o acesso necessário para uma tarefa.",
        scenario:
          "Uma colega precisa de consultar o horário de uma atividade do campus. Não precisa de alterar inscrições nem gerir contas.",
        instructions:
          "Escolhe a permissão que permite a consulta sem conceder poderes desnecessários.",
        question: "Que acesso é mais adequado?",
        answerOptions: [
          { id: "a", text: "Acesso de administração a todas as áreas." },
          { id: "b", text: "Acesso apenas de leitura ao horário." },
          { id: "c", text: "A mesma conta partilhada por toda a turma." },
          { id: "d", text: "Acesso permanente a todos os dados dos estudantes." },
        ],
        correctAnswer: "b",
        explanation:
          "O menor privilégio limita cada conta ao que a sua tarefa exige. O acesso de leitura ao horário resolve a necessidade sem permitir alterações ou consultas de outros dados.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 2,
      },
      {
        title: "Evitar passwords reutilizadas",
        slug: "evitar-passwords-reutilizadas",
        description: "Escolhe uma estratégia de autenticação mais segura.",
        scenario:
          "Um estudante percebe que reutilizou a mesma password em vários serviços. Um desses serviços anunciou uma exposição de contas.",
        instructions:
          "Escolhe a resposta que reduz o risco para as outras contas.",
        question: "O que deve fazer primeiro?",
        answerOptions: [
          { id: "a", text: "Manter a password igual para não a esquecer." },
          { id: "b", text: "Enviar a password a um colega para a guardar." },
          { id: "c", text: "Criar passwords únicas e longas e ativar MFA quando disponível." },
          { id: "d", text: "Usar o nome da escola como password em todos os serviços." },
        ],
        correctAnswer: "c",
        explanation:
          "Passwords únicas impedem que uma exposição num serviço facilite o acesso a outras contas. Um gestor de passwords e MFA ajudam a manter essa prática sem reutilização.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 3,
      },
      {
        title: "Terminar uma sessão partilhada",
        slug: "terminar-sessao-partilhada",
        description: "Protege uma conta depois de usar um computador partilhado.",
        scenario:
          "Depois de consultar materiais num computador partilhado da biblioteca, a estudante vai sair para a aula seguinte.",
        instructions:
          "Escolhe a sequência que melhor protege a conta e os dados.",
        question: "O que deve fazer antes de se afastar?",
        answerOptions: [
          { id: "a", text: "Terminar a sessão e confirmar que a conta saiu." },
          { id: "b", text: "Deixar a conta aberta para continuar mais tarde." },
          { id: "c", text: "Guardar a password no navegador para a próxima pessoa." },
          { id: "d", text: "Fechar apenas a janela, sem verificar a sessão." },
        ],
        correctAnswer: "a",
        explanation:
          "Terminar a sessão reduz o risco de outra pessoa usar a conta. Em dispositivos partilhados, também é prudente fechar o navegador e não guardar credenciais.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 4,
      },
    ],
  },
  {
    title: "Redes e Segurança Web",
    slug: "redes-seguranca-web",
    description:
      "Compreende protocolos, registos e controlos básicos usados por aplicações e redes.",
    order: 2,
    missions: [
      {
        title: "Distinguir HTTP de HTTPS",
        slug: "distinguir-http-https",
        description: "Interpreta o que a proteção HTTPS oferece e o que não garante.",
        scenario:
          "Um estudante abre um serviço de aprendizagem e verifica que o endereço começa por HTTPS.",
        instructions:
          "Escolhe a afirmação correta sobre a ligação.",
        question: "O que indica HTTPS?",
        answerOptions: [
          { id: "a", text: "O site é sempre legítimo e não pode conter conteúdo malicioso." },
          { id: "b", text: "A ligação usa TLS para proteger os dados em trânsito." },
          { id: "c", text: "O dispositivo não precisa de atualizações." },
          { id: "d", text: "A password fica visível apenas para o administrador." },
        ],
        correctAnswer: "b",
        explanation:
          "HTTPS protege a ligação entre o navegador e o servidor com TLS. Não prova, por si só, que o site é legítimo; é importante confirmar o domínio e o contexto.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 1,
      },
      {
        title: "Perceber a função do DNS",
        slug: "perceber-funcao-dns",
        description: "Identifica a função de resolução de nomes numa rede.",
        scenario:
          "Uma aplicação fictícia pede ao DNS o endereço associado a um nome de domínio antes de contactar o serviço.",
        instructions:
          "Escolhe a descrição que corresponde ao papel do DNS.",
        question: "Qual é a função principal do DNS?",
        answerOptions: [
          { id: "a", text: "Traduzir nomes de domínio em endereços usados na rede." },
          { id: "b", text: "Encriptar automaticamente todos os ficheiros do dispositivo." },
          { id: "c", text: "Substituir a autenticação das contas." },
          { id: "d", text: "Garantir que qualquer domínio é confiável." },
        ],
        correctAnswer: "a",
        explanation:
          "O DNS ajuda a encontrar o endereço associado a um nome. A resolução de nomes não substitui encriptação, autenticação nem a verificação de que um serviço é confiável.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 2,
      },
      {
        title: "Interpretar um registo de autenticação",
        slug: "interpretar-registo-autenticacao",
        description: "Escolhe uma resposta segura a tentativas de acesso falhadas.",
        scenario:
          "Num exercício fictício, um registo mostra várias tentativas falhadas numa conta de estudante, originadas pelo endereço reservado para documentação 192.0.2.55.",
        instructions:
          "Não contactes nem investigues o endereço. Escolhe o passo apropriado dentro do processo da escola.",
        question: "Qual deve ser a próxima ação?",
        answerOptions: [
          { id: "a", text: "Tentar ligar ao endereço para descobrir quem o controla." },
          { id: "b", text: "Publicar o registo completo nas redes sociais." },
          { id: "c", text: "Comunicar o evento ao responsável autorizado e seguir o processo da escola." },
          { id: "d", text: "Ignorar o registo porque as tentativas falharam." },
        ],
        correctAnswer: "c",
        explanation:
          "Um registo é um sinal para análise, não uma autorização para contactar um sistema. O responsável autorizado pode verificar o contexto, proteger a conta e seguir o procedimento local.",
        difficulty: MissionDifficulty.MEDIUM,
        points: 15,
        order: 3,
      },
      {
        title: "Proteger um formulário web",
        slug: "proteger-formulario-web",
        description: "Seleciona controlos para dados recebidos por uma aplicação.",
        scenario:
          "Uma aplicação escolar fictícia recebe inscrições através de um formulário e precisa de guardar os dados numa base de dados.",
        instructions:
          "Escolhe a abordagem que protege o processamento no servidor.",
        question: "Que controlos deve implementar a aplicação?",
        answerOptions: [
          { id: "a", text: "Confiar apenas na validação do navegador." },
          { id: "b", text: "Validar no servidor e usar consultas parametrizadas." },
          { id: "c", text: "Aceitar qualquer conteúdo se a ligação usar HTTPS." },
          { id: "d", text: "Desativar a validação para evitar erros de utilização." },
        ],
        correctAnswer: "b",
        explanation:
          "O navegador pode ser contornado, por isso o servidor deve validar os dados. Consultas parametrizadas separam os valores enviados da estrutura da consulta à base de dados.",
        difficulty: MissionDifficulty.MEDIUM,
        points: 15,
        order: 4,
      },
    ],
  },
  {
    title: "Phishing e Engenharia Social",
    slug: "phishing-engenharia-social",
    description:
      "Reconhece pedidos suspeitos e responde sem expor contas ou informação pessoal.",
    order: 3,
    missions: [
      {
        title: "Analisar uma mensagem urgente",
        slug: "analisar-mensagem-urgente",
        description: "Identifica sinais de phishing numa mensagem simulada.",
        scenario:
          "Uma mensagem fictícia, enviada de suporte@campus-aviso.test, diz que a conta será bloqueada em dez minutos e inclui um link para um domínio diferente.",
        instructions:
          "Procura sinais de urgência, inconsistência do remetente e destino do link. Não abras o link.",
        question: "Qual é a resposta mais segura?",
        answerOptions: [
          { id: "a", text: "Abrir o link rapidamente para evitar o bloqueio." },
          { id: "b", text: "Não abrir o link e confirmar o aviso por um canal oficial conhecido." },
          { id: "c", text: "Responder com a password para provar que a conta é tua." },
          { id: "d", text: "Reencaminhar a mensagem para toda a turma." },
        ],
        correctAnswer: "b",
        explanation:
          "A urgência e o domínio inesperado são sinais de alerta. Confirmar por um canal oficial independente evita depender do link ou dos contactos fornecidos na própria mensagem.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 1,
      },
      {
        title: "Receber um anexo inesperado",
        slug: "receber-anexo-inesperado",
        description: "Decide como tratar um anexo inesperado de um remetente desconhecido.",
        scenario:
          "Uma estudante recebe um anexo não solicitado com o nome trabalho_final.zip, enviado de um endereço fictício que não reconhece.",
        instructions:
          "Escolhe uma ação que não execute nem encaminhe o ficheiro.",
        question: "O que deve fazer?",
        answerOptions: [
          { id: "a", text: "Não abrir nem reencaminhar e reportar a mensagem pelo canal definido." },
          { id: "b", text: "Abrir o anexo para descobrir o que contém." },
          { id: "c", text: "Desativar o antivírus antes de abrir o ficheiro." },
          { id: "d", text: "Enviar o anexo para colegas testarem." },
        ],
        correctAnswer: "a",
        explanation:
          "Um anexo inesperado pode ser perigoso. Não o abras nem o distribuas; usa o processo de reporte da escola para que uma pessoa autorizada avalie a mensagem.",
        difficulty: MissionDifficulty.EASY,
        points: 10,
        order: 2,
      },
      {
        title: "Proteger um código de MFA",
        slug: "proteger-codigo-mfa",
        description: "Responde a um pedido de código feito por uma pessoa não verificada.",
        scenario:
          "Durante uma conversa simulada, alguém que afirma pertencer ao suporte pede o código temporário de MFA para resolver um problema.",
        instructions:
          "Escolhe a resposta que mantém o fator de autenticação privado.",
        question: "O que deve fazer a estudante?",
        answerOptions: [
          { id: "a", text: "Enviar o código porque expira rapidamente." },
          { id: "b", text: "Partilhar apenas metade do código." },
          { id: "c", text: "Não partilhar o código e verificar o pedido por um canal oficial." },
          { id: "d", text: "Desativar a MFA para evitar novos pedidos." },
        ],
        correctAnswer: "c",
        explanation:
          "Um código de MFA é um segredo temporário e não deve ser partilhado, mesmo com alguém que afirma ser do suporte. A identidade deve ser verificada por um canal oficial independente.",
        difficulty: MissionDifficulty.MEDIUM,
        points: 15,
        order: 3,
      },
      {
        title: "Verificar um pedido de dados",
        slug: "verificar-pedido-de-dados",
        description: "Confirma um pedido inesperado antes de partilhar informação.",
        scenario:
          "Uma mensagem fictícia num grupo de turma pede a lista de contactos e horários de colegas para uma atividade que não foi anunciada pelos responsáveis.",
        instructions:
          "Escolhe a resposta que protege a privacidade e confirma a legitimidade do pedido.",
        question: "Qual é o passo mais seguro?",
        answerOptions: [
          { id: "a", text: "Enviar os dados para não atrasar a atividade." },
          { id: "b", text: "Publicar a lista no grupo para todos decidirem." },
          { id: "c", text: "Pedir passwords para confirmar a identidade de quem pediu." },
          { id: "d", text: "Não partilhar os dados e confirmar o pedido com um responsável conhecido." },
        ],
        correctAnswer: "d",
        explanation:
          "Informação de colegas só deve ser partilhada quando existe uma finalidade legítima e autorização adequada. A confirmação independente evita que a pressão ou a falsa autoridade substituam a verificação.",
        difficulty: MissionDifficulty.MEDIUM,
        points: 15,
        order: 4,
      },
    ],
  },
];

export async function seedLearningContent(prisma: PrismaClient) {
  for (const moduleSeed of modules) {
    const module = await prisma.learningModule.upsert({
      where: { slug: moduleSeed.slug },
      create: {
        title: moduleSeed.title,
        slug: moduleSeed.slug,
        description: moduleSeed.description,
        order: moduleSeed.order,
        published: true,
      },
      update: {},
    });

    for (const mission of moduleSeed.missions) {
      await prisma.mission.upsert({
        where: { slug: mission.slug },
        create: {
          ...mission,
          moduleId: module.id,
          answerOptions: mission.answerOptions as Prisma.InputJsonValue,
          published: true,
        },
        update: {},
      });
    }
  }
}

const executedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (executedDirectly) {
  const prisma = new PrismaClient();
  try {
    await seedLearningContent(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
