import { useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  getGetAuthMeQueryKey,
  useLoginAuthUser,
  type AuthUser,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-provider';
import { getApiErrorMessage } from '../auth/auth-errors';
import Brand from '../components/brand';

export default function LoginPage() {
  const [formError, setFormError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useLoginAuthUser();

  if (auth.user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    try {
      const user = await login.mutateAsync({ data: { email, password } });
      queryClient.setQueryData<AuthUser>(getGetAuthMeQueryKey(), user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível iniciar sessão.'));
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-main">
          <div className="eyebrow">CyberLab Angola · v0.1</div>
          <h1>Aprender segurança. Com propósito.</h1>
          <p>Este ecrã faz parte de uma proposta inicial de plataforma de aprendizagem em cibersegurança.</p>
        </div>
        <div className="auth-aside-foot">Sessão protegida · CyberLab Angola</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <Link className="auth-back" to="/" data-testid="link-back-home"><ArrowLeft size={15} /> Voltar ao início</Link>
          <h2>Entrar</h2>
          <p className="auth-subtitle">Entre para continuar o seu percurso de aprendizagem.</p>
          <form onSubmit={handleSubmit} noValidate={false}>
            <div className="form-field">
              <label htmlFor="email">Endereço de e-mail</label>
              <input id="email" name="email" type="email" placeholder="nome@exemplo.ao" autoComplete="email" required maxLength={254} data-testid="input-email" />
            </div>
            <div className="form-field">
              <label htmlFor="password">Palavra-passe</label>
              <input id="password" name="password" type="password" placeholder="Introduza a sua palavra-passe" autoComplete="current-password" required minLength={1} maxLength={72} data-testid="input-password" />
            </div>
            {formError && <p className="form-alert" role="alert">{formError}</p>}
            <button className="button button-primary" type="submit" disabled={login.isPending} style={{ width: '100%', marginTop: 5 }} data-testid="button-login">
              {login.isPending ? 'A entrar…' : 'Entrar'}
            </button>
          </form>
          <p className="form-footnote">Ainda não tem conta? <Link className="text-link" to="/register" data-testid="link-register">Criar conta</Link></p>
          <div className="form-legal">A sessão é protegida por cookie HttpOnly. A palavra-passe nunca é devolvida pela API.</div>
        </div>
      </section>
    </main>
  );
}
