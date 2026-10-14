import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, ChartNoAxesColumnIncreasing, ClipboardCheck, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { getGetAuthMeQueryKey, useGetStudentMe, useLogoutAuthUser, type AuthUser } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-provider';
import { getApiErrorMessage } from '../auth/auth-errors';
import Brand from './brand';

const navigation = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/modules', label: 'Módulos', icon: BookOpen },
  { to: '/diagnostic', label: 'Diagnóstico', icon: ClipboardCheck },
  { to: '/progress', label: 'Progresso', icon: ChartNoAxesColumnIncreasing },
];

export default function LearningShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const profile = useGetStudentMe();
  const navigate = useNavigate();
  const client = useQueryClient();
  const logout = useLogoutAuthUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setError('');
    try {
      await logout.mutateAsync();
      client.setQueryData<AuthUser | null>(getGetAuthMeQueryKey(), null);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível terminar a sessão.'));
    }
  }

  return <div className="learn-app">
    <aside className={`learn-sidebar ${open ? 'is-open' : ''}`}>
      <div className="learn-brand"><Brand /><button className="mobile-nav-close" onClick={() => setOpen(false)} aria-label="Fechar navegação"><X size={19} /></button></div>
      <div className="sidebar-caption">ESPAÇO DO ESTUDANTE</div>
      <nav className="learn-nav" aria-label="Navegação de aprendizagem">
        {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => `learn-nav-link${isActive ? ' active' : ''}`}><Icon size={17} /><span>{label}</span><span className="nav-arrow">›</span></NavLink>)}
      </nav>
      <div className="sidebar-spacer" />
      <section className="sidebar-profile">
        <div className="profile-initial">{(profile.data?.name ?? user?.name)?.trim().charAt(0).toUpperCase() || 'C'}</div>
        <div className="profile-text"><strong>{profile.data?.name ?? user?.name}</strong><span>{profile.data?.email ?? user?.email}</span></div>
      </section>
      {error && <p className="sidebar-error" role="alert">{error}</p>}
      <button className="signout-button" onClick={signOut} disabled={logout.isPending}><LogOut size={16} />{logout.isPending ? 'A terminar sessão…' : 'Terminar sessão'}</button>
    </aside>
    {open && <button className="nav-scrim" aria-label="Fechar navegação" onClick={() => setOpen(false)} />}
    <div className="learn-main">
      <header className="learn-topbar"><button className="mobile-nav-trigger" onClick={() => setOpen(true)} aria-label="Abrir navegação"><Menu size={21} /></button><Link to="/dashboard" className="topbar-context">CyberLab <span>/</span> Aprendizagem</Link><div className="topbar-right"><span className="secure-indicator"><i /> Ambiente seguro</span><span className="topbar-avatar">{(profile.data?.name ?? user?.name)?.trim().charAt(0).toUpperCase() || 'C'}</span></div></header>
      <main className="learn-content">{children}</main>
    </div>
  </div>;
}
