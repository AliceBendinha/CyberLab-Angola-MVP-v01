import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Brand from '../components/brand';

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-main">
          <div className="eyebrow">CyberLab Angola · v0.1</div>
          <h1>Um percurso começa com curiosidade.</h1>
          <p>Conheça o conceito de uma proposta para aprender, praticar e desenvolver competências em cibersegurança.</p>
        </div>
        <div className="auth-aside-foot">Protótipo de interface · Não é um serviço operacional</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <Link className="auth-back" to="/" data-testid="link-back-home"><ArrowLeft size={15} /> Voltar ao início</Link>
          <h2>Criar conta</h2>
          <p className="auth-subtitle">O registo ainda não está activo. Este ecrã apresenta apenas a proposta visual.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <div className="form-field">
              <label htmlFor="name">Nome completo</label>
              <input id="name" name="name" type="text" placeholder="Como gostaria de ser chamado?" autoComplete="name" data-testid="input-name" />
            </div>
            <div className="form-field">
              <label htmlFor="email">Endereço de e-mail</label>
              <input id="email" name="email" type="email" placeholder="nome@exemplo.ao" autoComplete="email" data-testid="input-email" />
            </div>
            <div className="form-field">
              <label htmlFor="password">Palavra-passe</label>
              <input id="password" name="password" type="password" placeholder="Escolha uma palavra-passe" autoComplete="new-password" data-testid="input-password" />
            </div>
            <button className="button button-primary" type="submit" style={{ width: '100%', marginTop: 5 }} data-testid="button-register">
              Registo não disponível
            </button>
          </form>
          <p className="form-footnote">Já tem conta? <Link className="text-link" to="/login" data-testid="link-login">Entrar</Link></p>
          <div className="form-legal">Os dados introduzidos não são guardados nem enviados. O registo nesta proposta não cria uma conta.</div>
        </div>
      </section>
    </main>
  );
}
