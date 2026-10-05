import { ArrowRight, ArrowUpRight, BookOpen, Network, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import CircuitGraphic from '../components/circuit-graphic';
import SiteHeader from '../components/site-header';
import Brand from '../components/brand';

const principles = [
  {
    number: '01',
    icon: BookOpen,
    title: 'Aprendizagem prática',
    copy: 'Uma proposta de aprendizagem orientada à prática, com espaço para explorar conceitos de cibersegurança de forma aplicada.',
  },
  {
    number: '02',
    icon: Network,
    title: 'Orientação ao percurso',
    copy: 'A experiência pretende apoiar cada pessoa a compreender os próximos passos no seu percurso de aprendizagem.',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Competências em foco',
    copy: 'Acompanhamento pensado para tornar competências e evolução mais visíveis ao longo do processo.',
  },
  {
    number: '04',
    icon: ArrowUpRight,
    title: 'Pensada para Angola',
    copy: 'Uma iniciativa em fase de proposta, concebida com atenção ao contexto e às oportunidades locais.',
  },
];

export default function LandingPage() {
  return (
    <main className="site-shell">
      <div className="wrap">
        <SiteHeader />
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">Uma proposta de aprendizagem digital</div>
            <h1 id="hero-title">CyberLab <span>Angola</span></h1>
            <p className="tagline">Aprender. Simular. Demonstrar competências.</p>
            <p className="hero-description">
              Uma proposta de plataforma para apoiar a aprendizagem em cibersegurança.
              Pretende combinar aprendizagem prática, orientação inteligente e
              acompanhamento de competências — uma visão em desenvolvimento, ainda
              por validar.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/register" data-testid="button-start">
                Conhecer a proposta <ArrowRight size={16} />
              </Link>
              <a className="button button-quiet" href="#proposta" data-testid="button-learn-more">
                Como pensamos
              </a>
            </div>
            <div className="hero-note">
              <ShieldCheck size={16} />
              <span>Conceito inicial. Não representa um serviço operacional nem resultados já demonstrados.</span>
            </div>
          </div>
          <div className="hero-art">
            <CircuitGraphic />
          </div>
        </section>
      </div>

      <section className="intro-strip" aria-label="Enquadramento da proposta">
        <div className="wrap strip-inner">
          <span className="strip-kicker">PONTO DE PARTIDA</span>
          <p>Uma ideia para aproximar conhecimento, prática e desenvolvimento de competências em cibersegurança.</p>
        </div>
      </section>

      <section className="section wrap" id="proposta">
        <div className="section-heading">
          <div className="eyebrow">A visão, sem promessas</div>
          <h2>Conhecimento que se constrói com prática.</h2>
          <p>
            O CyberLab Angola é uma proposta inicial. Estes princípios descrevem a
            intenção do projecto, não funcionalidades já disponíveis ou resultados
            comprovados.
          </p>
        </div>
        <div className="principles">
          {principles.map(({ number, icon: Icon, title, copy }) => (
            <article className="principle" key={number} data-testid={`principle-${number}`}>
              <div className="principle-top"><span>0{number}</span><Icon size={18} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 88 }}>
        <div className="proposal-band">
          <div>
            <h3>Em fase de proposta</h3>
            <p>Estamos a apresentar uma direcção possível para a aprendizagem em cibersegurança em Angola.</p>
          </div>
          <Link className="button button-quiet" to="/register" data-testid="button-register-footer">
            Ver ecrã de registo <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <Brand />
          <span className="footer-note">Proposta inicial · CyberLab Angola · v0.1</span>
          <span>Conceito em desenvolvimento</span>
        </div>
      </footer>
    </main>
  );
}
