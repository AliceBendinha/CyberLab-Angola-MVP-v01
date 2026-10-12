import { Construction, LogOut } from 'lucide-react';
import { useState } from 'react';
import {
  getGetAuthMeQueryKey,
  useLogoutAuthUser,
  type AuthUser,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-provider';
import { getApiErrorMessage } from '../auth/auth-errors';
import Brand from '../components/brand';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useLogoutAuthUser();
  const [logoutError, setLogoutError] = useState('');

  if (!user) {
    return null;
  }

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout.mutateAsync();
      queryClient.setQueryData<AuthUser | null>(getGetAuthMeQueryKey(), null);
      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(getApiErrorMessage(error, 'Não foi possível terminar a sessão.'));
    }
  }

  const roleNames: Record<string, string> = {
    STUDENT: 'Estudante',
    INSTRUCTOR: 'Instrutor',
    ADMIN: 'Administrador',
  };

  return (
    <main className="site-shell dashboard-placeholder">
      <section className="dashboard-card">
        <header className="dashboard-header">
          <div>
            <Brand />
            <div className="eyebrow dashboard-eyebrow">Área de aprendizagem · v0.1</div>
            <h1 data-testid="dashboard-user-name">Bem-vindo, {user.name}</h1>
            <p>O seu espaço de aprendizagem em cibersegurança.</p>
          </div>
          <button
            className="button button-quiet"
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            data-testid="button-logout"
          >
            <LogOut size={15} />
            {logout.isPending ? 'A terminar…' : 'Terminar sessão'}
          </button>
        </header>

        {logoutError && <p className="form-alert dashboard-alert" role="alert">{logoutError}</p>}

        <section className="dashboard-account" aria-label="Dados da conta">
          <div>
            <span>Nome</span>
            <strong>{user.name}</strong>
          </div>
          <div>
            <span>E-mail</span>
            <strong data-testid="dashboard-user-email">{user.email}</strong>
          </div>
          <div>
            <span>Função</span>
            <strong className="role-badge" data-testid="dashboard-user-role">
              {roleNames[user.role] ?? user.role} <small>({user.role})</small>
            </strong>
          </div>
        </section>

        <section className="dashboard-modules" aria-labelledby="modules-heading">
          <div className="dashboard-section-heading">
            <div>
              <div className="eyebrow">PRÓXIMAS ETAPAS</div>
              <h2 id="modules-heading">A sua plataforma</h2>
            </div>
            <span className="module-count">5 módulos</span>
          </div>
          <div className="module-grid">
            {['Diagnóstico', 'Missões', 'Tutor IA', 'Competências', 'Progresso'].map((module) => (
              <article className="module-card" key={module}>
                <div className="placeholder-icon"><Construction size={19} /></div>
                <h3>{module}</h3>
                <span>Em breve</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
