import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="site-shell dashboard-placeholder">
      <section className="placeholder-box">
        <div className="eyebrow" style={{ justifyContent: 'center' }}>Página não encontrada</div>
        <h1>Este endereço não existe.</h1>
        <p>Volte à apresentação da proposta CyberLab Angola.</p>
        <Link className="button button-primary" to="/" data-testid="link-not-found-home">Ir para o início</Link>
      </section>
    </main>
  );
}
