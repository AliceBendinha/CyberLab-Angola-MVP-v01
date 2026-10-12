import { useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  getGetAuthMeQueryKey,
  useRegisterAuthUser,
  type AuthUser,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-provider';
import { getApiErrorMessage } from '../auth/auth-errors';
import Brand from '../components/brand';

export default function RegisterPage() {
  const [formError, setFormError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const register = useRegisterAuthUser();

  if (auth.user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    try {
      const user = await register.mutateAsync({
        data: { name, email, password },
      });
      queryClient.setQueryData<AuthUser>(getGetAuthMeQueryKey(), user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível criar a conta.'));
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-main">
          <div className="eyebrow">CyberLab Angola · v0.1</div>
          <h1>Um percurso começa com curiosidade.</h1>
          <p>Conheça o conceito de uma proposta para aprender, praticar e desenvolver competências em cibersegurança.</p>
        </div>
        <div className="auth-aside-foot">Registo protegido · CyberLab Angola</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <Link className="auth-back" to="/" data-testid="link-back-home"><ArrowLeft size={15} /> Voltar ao início</Link>
          <h2>Criar conta</h2>
          <p className="auth-subtitle">Crie uma conta de estudante para aceder à plataforma.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="name">Nome completo</label>
              <input id="name" name="name" type="text" placeholder="Como gostaria de ser chamado?" autoComplete="name" required maxLength={120} data-testid="input-name" />
            </div>
            <div className="form-field">
              <label htmlFor="email">Endereço de e-mail</label>
              <input id="email" name="email" type="email" placeholder="nome@exemplo.ao" autoComplete="email" required maxLength={254} data-testid="input-email" />
            </div>
            <div className="form-field">
              <label htmlFor="password">Palavra-passe</label>
              <input id="password" name="password" type="password" placeholder="Escolha uma palavra-passe" autoComplete="new-password" required minLength={8} maxLength={72} data-testid="input-password" />
            </div>
            {formError && <p className="form-alert" role="alert">{formError}</p>}
            <button className="button button-primary" type="submit" disabled={register.isPending} style={{ width: '100%', marginTop: 5 }} data-testid="button-register">
              {register.isPending ? 'A criar conta…' : 'Criar conta'}
            </button>
          </form>
          <p className="form-footnote">Já tem conta? <Link className="text-link" to="/login" data-testid="link-login">Entrar</Link></p>
          <div className="form-legal">A palavra-passe é guardada com hash seguro e o registo cria uma sessão protegida.</div>
        </div>
      </section>
    </main>
  );
}
