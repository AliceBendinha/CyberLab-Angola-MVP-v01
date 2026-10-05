import { Link } from 'react-router-dom';
import Brand from './brand';

export default function SiteHeader() {
  return (
    <header className="topbar">
      <Brand />
      <nav className="nav-links" aria-label="Navegação principal">
        <a className="nav-about" href="/#proposta" data-testid="link-about">A proposta</a>
        <Link to="/login" data-testid="link-login">Entrar</Link>
        <Link className="button button-quiet" to="/register" data-testid="link-register">Criar conta</Link>
      </nav>
    </header>
  );
}
