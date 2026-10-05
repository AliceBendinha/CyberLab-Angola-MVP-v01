import { ArrowLeft, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import Brand from '../components/brand';

export default function DashboardPage() {
  return (
    <main className="site-shell dashboard-placeholder">
      <section className="placeholder-box">
        <div className="placeholder-icon"><Construction size={23} /></div>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>CyberLab Angola · proposta v0.1</div>
        <h1>Área de aprendizagem</h1>
        <p>
          Este espaço é apenas um marcador de posição. A proposta ainda não inclui
          uma área de aprendizagem nem apresenta dados de participantes.
        </p>
        <Link className="button button-quiet" to="/" data-testid="link-dashboard-home"><ArrowLeft size={15} /> Voltar à página inicial</Link>
      </section>
    </main>
  );
}
