import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetLearningMissionQueryKey,
  getGetStudentMeQueryKey,
  getGetStudentProgressQueryKey,
  getListLearningModulesQueryKey,
  getListMissionAttemptsQueryKey,
  useGetInitialDiagnostic,
  useGetLearningMission,
  useGetLearningModule,
  useGetStudentMe,
  useGetStudentProgress,
  useListLearningModules,
  useListMissionAttempts,
  useListModuleMissions,
  useSubmitInitialDiagnostic,
  useSubmitMissionAttempt,
  useUpdateStudentMe,
} from '@workspace/api-client-react';
import type { DiagnosticHistoryRecord, LearningLevel, MissionAttemptRecord, MissionAttemptResult } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleAlert, Clock3, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import LearningShell from '../components/learning-shell';
import { useAuth } from '../auth/auth-provider';
import { getApiErrorMessage } from '../auth/auth-errors';

const levelLabel: Record<LearningLevel, string> = { BEGINNER: 'Iniciante', ELEMENTARY: 'Elementar', INTERMEDIATE: 'Intermédio' };
const difficultyLabel: Record<string, string> = { EASY: 'Básica', MEDIUM: 'Intermédia', HARD: 'Avançada' };
const roleLabel: Record<string, string> = { STUDENT: 'Estudante', INSTRUCTOR: 'Instrutor', ADMIN: 'Administrador' };
const dateLabel = (date?: string | null) => date ? new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Sem actividade registada';

function LoadingBlock({ label = 'A carregar os seus dados…' }: { label?: string }) {
  return <div className="learning-state" aria-busy="true"><span className="skeleton skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line short" /><p>{label}</p></div>;
}
function ErrorBlock({ error, retry }: { error: unknown; retry: () => void }) {
  return <section className="state-panel error-state" role="alert"><CircleAlert size={22} /><div><strong>Não foi possível carregar esta informação.</strong><p>{getApiErrorMessage(error)}</p></div><button className="button button-quiet" onClick={retry}><RefreshCw size={15} />Tentar novamente</button></section>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}
function EmptyState({ title, text, to, action }: { title: string; text: string; to?: string; action?: string }) {
  return <div className="empty-panel"><span className="empty-mark"><ShieldCheck size={20} /></span><h3>{title}</h3><p>{text}</p>{to && <Link className="button button-primary" to={to}>{action ?? 'Continuar'}<ArrowRight size={16} /></Link>}</div>;
}
function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value || 0));
  return <div className="progress-track" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${safe}%` }} /></div>;
}
function LearningFrame({ children }: { children: ReactNode }) { return <LearningShell>{children}</LearningShell>; }

export function DashboardLearningPage() {
  const { user } = useAuth();
  const profile = useGetStudentMe();
  const progress = useGetStudentProgress();
  const modules = useListLearningModules();
  const update = useUpdateStudentMe();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [editError, setEditError] = useState('');

  async function saveName(event: FormEvent) {
    event.preventDefault();
    setEditError(''); setNotice('');
    try {
      const result = await update.mutateAsync({ data: { name: name.trim() } });
      client.setQueryData(getGetStudentMeQueryKey(), result);
      await client.invalidateQueries({ queryKey: getGetStudentMeQueryKey() });
      setEditing(false); setNotice('O seu nome foi actualizado.');
    } catch (error) { setEditError(getApiErrorMessage(error, 'Não foi possível actualizar o nome.')); }
  }
  const firstModule = modules.data?.[0];
  const latestDiagnostic = progress.data?.diagnosticHistory[0];
  const recommendedModule = latestDiagnostic
    ? modules.data?.find(module =>
      module.slug === latestDiagnostic.recommendedModule.slug &&
      module.progress.completedMissions < module.progress.totalMissions
    )
    : undefined;
  const nextModule = recommendedModule ??
    modules.data?.find(module =>
      module.progress.completedMissions < module.progress.totalMissions
    ) ??
    firstModule;
  const nextStep = !profile.data?.diagnosticCompleted
    ? {
      to: '/diagnostic',
      title: 'Concluir o diagnóstico inicial',
      description: 'O resultado guardado indica um ponto de partida para o teu percurso.',
      action: 'Fazer diagnóstico',
    }
    : nextModule
      ? {
        to: `/modules/${nextModule.slug}`,
        title: `Continuar em ${nextModule.title}`,
        description: `${nextModule.progress.completedMissions} de ${nextModule.progress.totalMissions} missões concluídas neste módulo.`,
        action: 'Abrir módulo recomendado',
      }
      : modules.data?.length
        ? {
          to: '/progress',
          title: 'Rever o teu progresso',
          description: 'Já concluíste as missões publicadas; consulta o teu histórico.',
          action: 'Ver progresso',
        }
        : {
          to: '/modules',
          title: 'Explorar módulos',
          description: 'Consulta os módulos publicados disponíveis para a tua conta.',
          action: 'Ver módulos',
        };
  return <LearningFrame>
    <PageHeading eyebrow="PAINEL DE APRENDIZAGEM" title={`Olá, ${profile.data?.name ?? user?.name ?? ''}.`} description="Continue de onde parou. Cada missão é uma oportunidade de praticar com segurança." />
    {(profile.isPending || progress.isPending) ? <LoadingBlock /> : (profile.isError || progress.isError) ? <ErrorBlock error={profile.error ?? progress.error} retry={() => { void profile.refetch(); void progress.refetch(); }} /> : <>
      <div className="dashboard-indicator-row">
        <span className={`diagnostic-status ${profile.data.diagnosticCompleted ? 'complete' : 'pending'}`}>
          {profile.data.diagnosticCompleted ? 'Diagnóstico concluído' : 'Diagnóstico pendente'}
        </span>
        <span className="dashboard-module-count" aria-live="polite">
          {modules.isPending ? 'A carregar módulos…' : modules.isError ? 'Módulos temporariamente indisponíveis' : `${modules.data.length} módulos disponíveis`}
        </span>
      </div>
      {progress.data && <section className="welcome-progress">
        <div className="welcome-progress-copy"><div className="eyebrow">O SEU PERCURSO</div><h2>Aprender, praticando.</h2><p>O seu progresso fica guardado para que possa retomar a qualquer momento.</p><Link to={firstModule ? `/modules/${firstModule.slug}` : '/modules'} className="button button-primary">{progress.data.completedMissions > 0 ? 'Retomar aprendizagem' : 'Explorar módulos'}<ArrowRight size={16} /></Link></div>
        <div className="progress-orbit"><strong>{progress.data.completionPercent}%</strong><span>concluído</span><div className="orbit-track"><i style={{ transform: `rotate(${Math.max(0, Math.min(100, progress.data.completionPercent)) * 3.6}deg)` }} /></div></div>
        <div className="welcome-foot"><span><b>{progress.data.completedMissions}</b> de {progress.data.totalMissions} missões concluídas</span><span><b>{progress.data.pointsEarned}</b> pontos de {progress.data.pointsAvailable}</span></div>
      </section>}
      <div className="dashboard-columns">
        <section className="content-panel account-panel">
          <div className="panel-heading"><div><div className="eyebrow">A SUA CONTA</div><h2>Perfil de estudante</h2></div><button className="text-button" onClick={() => { setName(profile.data?.name ?? ''); setEditing(!editing); setEditError(''); }}> {editing ? 'Cancelar' : 'Editar nome'}</button></div>
          {editing ? <form className="profile-edit" onSubmit={saveName}><label htmlFor="display-name">Nome de apresentação</label><div className="profile-edit-row"><input id="display-name" value={name} onChange={event => setName(event.target.value)} maxLength={120} required /><button className="button button-primary" disabled={update.isPending || !name.trim()}>{update.isPending ? 'A guardar…' : 'Guardar'}</button></div>{editError && <p className="inline-error" role="alert">{editError}</p>}</form> : <>
            <div className="account-data"><div><span>Nome</span><strong>{profile.data?.name}</strong></div><div><span>E-mail</span><strong>{profile.data?.email}</strong></div><div><span>Função</span><strong>{roleLabel[user?.role ?? ''] ?? user?.role}</strong></div><div><span>Nível de aprendizagem</span><strong className="level-label">{profile.data?.learningLevel ? levelLabel[profile.data.learningLevel] : 'Ainda não definido'}</strong></div></div>
          </>}
          {notice && <p className="success-inline" role="status"><Check size={15} />{notice}</p>}
        </section>
        <section className="content-panel">
          <div className="panel-heading"><div><div className="eyebrow">ACESSO RÁPIDO</div><h2>Próxima etapa</h2></div></div>
          <div className="quick-links">
            <Link to={nextStep.to} className="quick-link"><span className="quick-icon"><ClipboardIcon /></span><span><strong>{nextStep.title}</strong><small>{nextStep.description}</small></span><ArrowRight size={16} /></Link>
            <Link to="/modules" className="quick-link"><span className="quick-icon"><BookIcon /></span><span><strong>Ver módulos publicados</strong><small>Missões práticas ao seu ritmo</small></span><ArrowRight size={16} /></Link>
            <Link to="/progress" className="quick-link"><span className="quick-icon"><ProgressIcon /></span><span><strong>Consultar progresso</strong><small>Histórico e actividade recente</small></span><ArrowRight size={16} /></Link>
          </div>
        </section>
      </div>
      <section className="section-block"><div className="section-title-row"><div><div className="eyebrow">CONTINUE A PRATICAR</div><h2>Módulos publicados</h2></div><Link className="text-link" to="/modules">Ver todos <ArrowRight size={15} /></Link></div>
        {modules.isPending ? <LoadingBlock label="A procurar módulos disponíveis…" /> : modules.isError ? <ErrorBlock error={modules.error} retry={() => void modules.refetch()} /> : !modules.data?.length ? <EmptyState title="Ainda não há módulos publicados" text="Quando estiverem disponíveis, encontrará aqui percursos de aprendizagem práticos." /> :
          <div className="module-list">{modules.data.slice(0, 3).map((module, index) => <Link to={`/modules/${module.slug}`} key={module.id} className="module-row"><span className="module-index">{String(index + 1).padStart(2, '0')}</span><div className="module-row-body"><div className="module-row-title"><strong>{module.title}</strong><span>{module.progress.completedMissions}/{module.progress.totalMissions} missões</span></div><ProgressBar value={module.progress.completionPercent} /></div><ArrowRight size={17} /></Link>)}</div>}
      </section>
      <section className="section-block">
        <div className="section-title-row"><div><div className="eyebrow">ACTIVIDADE RECENTE</div><h2>Últimas tentativas</h2></div><Link className="text-link" to="/progress">Histórico completo <ArrowRight size={15} /></Link></div>
        {!progress.data.recentAttempts.length
          ? <EmptyState title="Ainda sem actividade" text="As tuas tentativas aparecerão aqui depois de submeteres uma resposta." to="/modules" action="Encontrar uma missão" />
          : <div className="dashboard-recent-list">{progress.data.recentAttempts.slice(0, 3).map(attempt =>
            <div className="dashboard-recent-item" key={attempt.id}>
              <div><strong>{attempt.missionTitle}</strong><span>{attempt.isCorrect ? 'Resposta correta' : 'Tentativa registada'} · tentativa {attempt.attemptNumber}</span></div>
              <b>{attempt.score} pts</b>
              <small>{dateLabel(attempt.completedAt)}</small>
            </div>
          )}</div>}
      </section>
      <div className="placeholder-strip"><div className="placeholder-symbol"><Sparkles size={19} /></div><div><strong>Tutor IA e Competências</strong><span>Estas áreas continuam como espaços reservados nesta versão.</span></div><span className="soon-tag">EM BREVE</span></div>
    </>}
  </LearningFrame>;
}

function ClipboardIcon() { return <LockKeyhole size={17} />; }
function BookIcon() { return <ShieldCheck size={17} />; }
function ProgressIcon() { return <Clock3 size={17} />; }

export function ModulesPage() {
  const query = useListLearningModules();
  return <LearningFrame><PageHeading eyebrow="BIBLIOTECA DE APRENDIZAGEM" title="Módulos" description="Percursos publicados para desenvolver hábitos digitais mais seguros." />
    {query.isPending ? <LoadingBlock /> : query.isError ? <ErrorBlock error={query.error} retry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState title="Sem módulos disponíveis" text="Não existem módulos publicados para apresentar neste momento." to="/dashboard" action="Voltar ao painel" /> :
      <div className="catalogue-list">{query.data.map((module, index) => <Link className="catalogue-card" to={`/modules/${module.slug}`} key={module.id}><div className="catalogue-number">{String(index + 1).padStart(2, '0')}</div><div className="catalogue-main"><div className="catalogue-meta"><span>{module.missionCount} {module.missionCount === 1 ? 'missão' : 'missões'}</span><span>{module.progress.completionPercent}% concluído</span></div><h2>{module.title}</h2><p>{module.description}</p><ProgressBar value={module.progress.completionPercent} /><span className="catalogue-sub">{module.progress.completedMissions} de {module.progress.totalMissions} missões concluídas · {module.progress.pointsEarned} / {module.progress.pointsAvailable} pontos</span></div><ArrowRight className="catalogue-arrow" size={19} /></Link>)}</div>}
  </LearningFrame>;
}

export function LearningModulePage() {
  const { slug = '' } = useParams();
  const module = useGetLearningModule(slug);
  const missions = useListModuleMissions(slug);
  return <LearningFrame><Link to="/modules" className="back-link"><ArrowLeft size={15} /> Todos os módulos</Link>
    {module.isPending ? <LoadingBlock /> : module.isError ? <ErrorBlock error={module.error} retry={() => void module.refetch()} /> : <PageHeading eyebrow={`MÓDULO ${String(module.data.order).padStart(2, '0')}`} title={module.data.title} description={module.data.description} />}
    {!module.isPending && !module.isError && <div className="module-summary"><div><span>Missões concluídas</span><strong>{module.data.progress.completedMissions} <small>/ {module.data.progress.totalMissions}</small></strong></div><div><span>Pontos</span><strong>{module.data.progress.pointsEarned} <small>/ {module.data.progress.pointsAvailable}</small></strong></div><div><span>Progresso</span><strong>{module.data.progress.completionPercent}%</strong></div><ProgressBar value={module.data.progress.completionPercent} /></div>}
    <section className="section-block"><div className="section-title-row"><div><div className="eyebrow">PRÁTICA ORIENTADA</div><h2>Missões do módulo</h2></div></div>
      {missions.isPending ? <LoadingBlock label="A carregar as missões publicadas…" /> : missions.isError ? <ErrorBlock error={missions.error} retry={() => void missions.refetch()} /> : !missions.data?.length ? <EmptyState title="Este módulo ainda não tem missões" text="As missões serão apresentadas aqui quando forem publicadas." /> : <div className="mission-list">{missions.data.map((mission, index) => <Link className="mission-row" key={mission.id} to={`/missions/${mission.id}`}><span className={`mission-status ${mission.isCompleted ? 'done' : ''}`}>{mission.isCompleted ? <CheckCircle2 size={18} /> : String(index + 1).padStart(2, '0')}</span><div className="mission-info"><div className="mission-title-line"><strong>{mission.title}</strong><span className={`difficulty difficulty-${mission.difficulty.toLowerCase()}`}>{difficultyLabel[mission.difficulty]}</span></div><p>{mission.description}</p><span className="mission-meta">{mission.points} pontos · {mission.attemptCount} {mission.attemptCount === 1 ? 'tentativa' : 'tentativas'}{mission.bestScore !== null && ` · melhor resultado ${mission.bestScore}`}</span></div><ArrowRight size={17} /></Link>)}</div>}
    </section>
  </LearningFrame>;
}

export function MissionPage() {
  const { id = '' } = useParams();
  const mission = useGetLearningMission(id);
  const attempts = useListMissionAttempts(id);
  const submit = useSubmitMissionAttempt();
  const client = useQueryClient();
  const [choice, setChoice] = useState('');
  const [result, setResult] = useState<MissionAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [locked, setLocked] = useState(false);

  async function sendAnswer(event: FormEvent) {
    event.preventDefault();
    if (!choice || locked || submit.isPending) return;
    setLocked(true); setSubmitError('');
    try {
      const answer = await submit.mutateAsync({ id, data: { submittedAnswer: choice } });
      setResult(answer);
      setChoice('');
      await Promise.all([
        client.invalidateQueries({ queryKey: getListMissionAttemptsQueryKey(id) }),
        client.invalidateQueries({ queryKey: getGetLearningMissionQueryKey(id) }),
        client.invalidateQueries({ queryKey: getGetStudentProgressQueryKey() }),
        client.invalidateQueries({ queryKey: getListLearningModulesQueryKey() }),
      ]);
    } catch (error) { setSubmitError(getApiErrorMessage(error, 'A resposta não foi enviada. Tente novamente.')); }
    finally { setLocked(false); }
  }
  return <LearningFrame><Link to="/modules" className="back-link"><ArrowLeft size={15} /> Voltar aos módulos</Link>
    {mission.isPending ? <LoadingBlock label="A preparar a missão…" /> : mission.isError ? <ErrorBlock error={mission.error} retry={() => void mission.refetch()} /> : <>
      <PageHeading eyebrow={`MISSÃO · ${difficultyLabel[mission.data.difficulty]}`} title={mission.data.title} description={mission.data.description} />
      <div className="mission-detail-grid"><article className="content-panel scenario-panel"><div className="eyebrow">CENÁRIO</div><h2>O que está a acontecer?</h2><p>{mission.data.scenario}</p><div className="instructions-box"><strong>O seu desafio</strong><p>{mission.data.instructions}</p></div><div className="question-block"><div className="eyebrow">A SUA DECISÃO</div><h3>{mission.data.question}</h3>
        {result && <div className={`answer-feedback ${result.isCorrect ? 'correct' : 'incorrect'}`} role="status"><div className="feedback-score">{result.isCorrect ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}<strong>{result.isCorrect ? 'Boa decisão' : 'Resposta registada'}</strong><span>{result.score} / {result.maxScore} pontos</span></div><p>{result.feedback}</p><details><summary>Ver explicação</summary><p>{result.explanation}</p></details></div>}
        {submitError && <p className="inline-error" role="alert">{submitError}</p>}
        <form onSubmit={sendAnswer} className="answer-form"><fieldset disabled={submit.isPending || locked}><legend className="sr-only">Escolha uma resposta</legend>{mission.data.answerOptions.map(option => <label key={option.id} className={`answer-option ${choice === option.id ? 'selected' : ''}`}><input type="radio" name="mission-answer" value={option.id} checked={choice === option.id} onChange={() => setChoice(option.id)} /><span className="radio-custom" /><span>{option.text}</span></label>)}</fieldset><button className="button button-primary" disabled={!choice || submit.isPending || locked}>{submit.isPending || locked ? 'A avaliar a resposta…' : 'Enviar resposta'}<ArrowRight size={16} /></button><p className="answer-note"><LockKeyhole size={14} /> A explicação só aparece depois de enviar a resposta.</p></form>
      </div></article><aside className="mission-aside"><div className="content-panel mission-facts"><div className="eyebrow">DETALHES</div><div><span>Pontuação possível</span><strong>{mission.data.points} pontos</strong></div><div><span>Tentativas anteriores</span><strong>{mission.data.attemptCount}</strong></div><div><span>Melhor pontuação</span><strong>{mission.data.bestScore ?? '—'}</strong></div></div>
        <div className="content-panel attempt-panel"><div className="panel-heading"><div><div className="eyebrow">HISTÓRICO</div><h2>As suas tentativas</h2></div></div>{attempts.isPending ? <LoadingBlock label="A carregar o histórico…" /> : attempts.isError ? <ErrorBlock error={attempts.error} retry={() => void attempts.refetch()} /> : !attempts.data?.length ? <p className="subtle-copy">Ainda não submeteu uma resposta a esta missão.</p> : <div className="attempt-list">{attempts.data.map(item => <AttemptRow key={item.id} attempt={item} />)}</div>}</div>
      </aside></div>
    </>}
  </LearningFrame>;
}

function AttemptRow({ attempt }: { attempt: MissionAttemptRecord }) {
  return <div className="attempt-row"><span className={`attempt-result ${attempt.isCorrect ? 'good' : 'try-again'}`}>{attempt.isCorrect ? <Check size={14} /> : '•'}</span><div><strong>Tentativa {attempt.attemptNumber}</strong><small>{dateLabel(attempt.completedAt)}</small></div><b>{attempt.score} pts</b></div>;
}

export function DiagnosticPage() {
  const diagnostic = useGetInitialDiagnostic();
  const profile = useGetStudentMe();
  const submit = useSubmitInitialDiagnostic();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  async function submitAnswers(event: FormEvent) {
    event.preventDefault();
    if (!diagnostic.data || Object.keys(answers).length !== diagnostic.data.questions.length || submit.isPending) return;
    setError('');
    try {
      const result = await submit.mutateAsync({ data: { answers: diagnostic.data.questions.map(question => ({ questionId: question.id, selectedOptionId: answers[question.id] })) } });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetStudentProgressQueryKey() }),
        client.invalidateQueries({ queryKey: getGetStudentMeQueryKey() }),
      ]);
      navigate(`/diagnostic/results/${result.attemptId}`);
    } catch (err) { setError(getApiErrorMessage(err, 'Não foi possível guardar o diagnóstico.')); }
  }
  return <LearningFrame><PageHeading eyebrow="PONTO DE PARTIDA" title={diagnostic.data?.title ?? 'Diagnóstico inicial'} description={diagnostic.data?.introduction ?? 'Responda às perguntas para orientar o seu percurso.'} />
    {diagnostic.isPending || profile.isPending ? <LoadingBlock label="A preparar o diagnóstico…" /> : diagnostic.isError ? <ErrorBlock error={diagnostic.error} retry={() => void diagnostic.refetch()} /> : profile.isError ? <ErrorBlock error={profile.error} retry={() => void profile.refetch()} /> : <>
      {profile.data.diagnosticCompleted && <div className="diagnostic-repeat-note" role="status">Já existe um resultado guardado. Podes repetir o diagnóstico; as tentativas anteriores serão mantidas no histórico.</div>}
      <div className="diagnostic-intro"><ShieldCheck size={20} /><span>Não é um exame. As suas respostas ajudam a encontrar o ponto de partida adequado.</span><strong>{diagnostic.data.totalQuestions} perguntas</strong></div>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <form className="diagnostic-form" onSubmit={submitAnswers}>{diagnostic.data.questions.map((question, index) => <fieldset className="diagnostic-question" key={question.id} disabled={submit.isPending}><legend><span className="question-number">{String(index + 1).padStart(2, '0')}</span><span><small>{question.topic}</small>{question.question}</span></legend><div className="diagnostic-options">{question.options.map(option => <label key={option.id} className={`answer-option ${answers[question.id] === option.id ? 'selected' : ''}`}><input type="radio" name={`question-${question.id}`} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: option.id }))} /><span className="radio-custom" /><span>{option.text}</span></label>)}</div></fieldset>)}<div className="diagnostic-submit"><span>{Object.keys(answers).length} / {diagnostic.data.questions.length} respondidas</span><button className="button button-primary" disabled={submit.isPending || Object.keys(answers).length !== diagnostic.data.questions.length}>{submit.isPending ? 'A guardar respostas…' : profile.data.diagnosticCompleted ? 'Repetir diagnóstico' : 'Concluir diagnóstico'}<ArrowRight size={16} /></button></div></form>
    </>}
  </LearningFrame>;
}

export function DiagnosticResultsPage() {
  const { attemptId = '' } = useParams();
  const progress = useGetStudentProgress();
  const record: DiagnosticHistoryRecord | undefined = progress.data?.diagnosticHistory.find(item => item.attemptId === attemptId);
  return <LearningFrame><Link to="/progress" className="back-link"><ArrowLeft size={15} /> Histórico de progresso</Link><PageHeading eyebrow="RESULTADO GUARDADO" title="O seu diagnóstico" description="Resultado recuperado do histórico da sua aprendizagem." />
    {progress.isPending ? <LoadingBlock label="A procurar o resultado guardado…" /> : progress.isError ? <ErrorBlock error={progress.error} retry={() => void progress.refetch()} /> : !record ? <EmptyState title="Resultado não encontrado" text="Este resultado não consta no histórico de progresso da sua conta." to="/progress" action="Voltar ao progresso" /> : <section className="result-hero"><div className="result-illustration"><div className="result-ring"><span>{record.score}<small>%</small></span></div></div><div className="result-copy"><div className="eyebrow">DIAGNÓSTICO · {dateLabel(record.completedAt)}</div><h2>Nível {levelLabel[record.learningLevel]}</h2><p>Acertou em <strong>{record.correctAnswers} de {record.totalQuestions}</strong> perguntas.</p><div className="recommended-box"><span>RECOMENDAÇÃO</span><strong>{record.recommendedModule.title}</strong><Link className="button button-primary" to={`/modules/${record.recommendedModule.slug}`}>Explorar módulo recomendado <ArrowRight size={16} /></Link></div></div></section>}
  </LearningFrame>;
}

export function ProgressPage() {
  const progress = useGetStudentProgress();
  return <LearningFrame><PageHeading eyebrow="O SEU PERCURSO" title="Progresso" description="Uma vista clara do que já praticou e do que pode retomar." />
    {progress.isPending ? <LoadingBlock /> : progress.isError ? <ErrorBlock error={progress.error} retry={() => void progress.refetch()} /> : <>
      <section className="stats-row"><div className="stat-card"><span>Missões concluídas</span><strong>{progress.data.completedMissions}<small> / {progress.data.totalMissions}</small></strong></div><div className="stat-card"><span>Pontos conquistados</span><strong>{progress.data.pointsEarned}<small> / {progress.data.pointsAvailable}</small></strong></div><div className="stat-card"><span>Conclusão total</span><strong>{progress.data.completionPercent}<small>%</small></strong></div><div className="stat-card"><span>Nível actual</span><strong className="stat-level">{levelLabel[progress.data.learningLevel]}</strong></div></section>
      <section className="section-block"><div className="section-title-row"><div><div className="eyebrow">PERCURSOS</div><h2>Progresso por módulo</h2></div><Link to="/modules" className="text-link">Ver módulos <ArrowRight size={15} /></Link></div>
        {!progress.data.modules.length ? <EmptyState title="Nenhum módulo no percurso" text="Os módulos publicados e o seu progresso aparecerão aqui." to="/modules" action="Explorar módulos" /> : <div className="progress-module-list">{progress.data.modules.map(module => <Link key={module.id} to={`/modules/${module.slug}`} className="progress-module"><div className="progress-module-top"><div><strong>{module.title}</strong><span>{module.progress.completedMissions} / {module.progress.totalMissions} missões</span></div><b>{module.progress.completionPercent}%</b></div><ProgressBar value={module.progress.completionPercent} /><small>{module.progress.pointsEarned} / {module.progress.pointsAvailable} pontos · {dateLabel(module.progress.lastActivityAt)}</small></Link>)}</div>}
      </section>
      <section className="section-block"><div className="section-title-row"><div><div className="eyebrow">ACTIVIDADE RECENTE</div><h2>Histórico de missões</h2></div></div>
        {!progress.data.recentAttempts.length ? <EmptyState title="Sem tentativas registadas" text="Quando submeter respostas a missões, o histórico será apresentado aqui." to="/modules" action="Encontrar uma missão" /> : <div className="history-table"><div className="history-head"><span>Missão</span><span>Resultado</span><span>Pontuação</span><span>Data</span></div>{progress.data.recentAttempts.map(attempt => <div className="history-row" key={attempt.id}><strong>{attempt.missionTitle}</strong><span className={`history-status ${attempt.isCorrect ? 'good' : ''}`}>{attempt.isCorrect ? 'Correcta' : 'Submetida'} · #{attempt.attemptNumber}</span><span>{attempt.score} pontos</span><span>{dateLabel(attempt.completedAt)}</span></div>)}</div>}
      </section>
      <section className="section-block"><div className="section-title-row"><div><div className="eyebrow">PONTO DE PARTIDA</div><h2>Histórico de diagnóstico</h2></div><Link to="/diagnostic" className="text-link">Diagnóstico inicial <ArrowRight size={15} /></Link></div>
        {!progress.data.diagnosticHistory.length ? <EmptyState title="Sem diagnóstico guardado" text="O diagnóstico inicial ajuda a orientar o seu ponto de partida." to="/diagnostic" action="Fazer diagnóstico" /> : <div className="diagnostic-history">{progress.data.diagnosticHistory.map(item => <div key={item.attemptId} className="diagnostic-history-row"><span className="history-score">{item.score}%</span><div><strong>Nível {levelLabel[item.learningLevel]}</strong><small>{item.correctAnswers} de {item.totalQuestions} respostas correctas · {dateLabel(item.completedAt)}</small></div><Link to={`/diagnostic/results/${item.attemptId}`} className="button button-quiet">Ver resultado<ArrowRight size={14} /></Link></div>)}</div>}
      </section>
    </>}
  </LearningFrame>;
}
