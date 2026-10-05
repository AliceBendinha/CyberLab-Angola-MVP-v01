import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Brand from '../components/brand';

export default function LoginPage() {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-main">
          <div className="eyebrow">CyberLab Angola · v0.1</div>
          <h1>Aprender segurança. Com propósito.</h1>
          <p>Este ecrã faz parte de uma proposta inicial de plataforma de aprendizagem em cibersegurança.</p>
        </div>
        <div className="auth-aside-foot">Protótipo de interface · Não é um serviço operacional</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <Link className="auth-back" to="/" data-testid="link-back-home"><ArrowLeft size={15} /> Voltar ao início</Link>
          <h2>Entrar</h2>
          <p className="auth-subtitle">O acesso ainda não está disponível nesta proposta.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <div className="form-field">
              <label htmlFor="email">Endereço de e-mail</label>
              <input id="email" name="email" type="email" placeholder="nome@exemplo.ao" autoComplete="email" data-testid="input-email" />
            </div>
            <div className="form-field">
              <label htmlFor="password">Palavra-passe</label>
              <input id="password" name="password" type="password" placeholder="Introduza a sua palavra-passe" autoComplete="current-password" data-testid="input-password" />
            </div>
            <button className="button button-primary" type="submit" style={{ width: '100%', marginTop: 5 }} data-testid="button-login">
              Entrar na proposta
            </button>
          </form>
          <p className="form-footnote">Ainda não tem conta? <Link className="text-link" to="/register" data-testid="link-register">Criar conta</Link></p>
          <div className="form-legal">Este formulário é apenas demonstrativo. Não recolhe nem envia dados e não cria uma sessão.</div>
        </div>
      </section>
    </main>
  );
}
