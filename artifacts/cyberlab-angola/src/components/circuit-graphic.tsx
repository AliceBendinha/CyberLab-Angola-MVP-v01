export default function CircuitGraphic() {
  return (
    <div className="circuit-panel" role="img" aria-label="Ilustração abstrata de uma rede protegida">
      <div className="panel-meta">
        <span>CYBERLAB / VISÃO GERAL</span>
        <span className="signal"><i /> AMBIENTE DE PROPOSTA</span>
      </div>
      <div className="network">
        <svg viewBox="0 0 400 300" aria-hidden="true">
          <path className="net-line" d="M200 146L89 82l-29 69 63 82 77-87 84 89 67-79-43-74-108 64 112 9" />
          <path className="net-line dim" d="M89 82l111 64 51-72 57 9-57 98M123 233l-5-82 82-5 26 112M200 146l132 10M89 82l13-43 98 107" />
          <path className="net-line dim" d="M60 151l140-5 168 45M251 74l-51 72 9-105 48 33" />
          <circle className="net-dot dim" cx="89" cy="82" r="4" />
          <circle className="net-dot dim" cx="60" cy="151" r="4" />
          <circle className="net-dot" cx="118" cy="151" r="4" />
          <circle className="net-dot dim" cx="123" cy="233" r="4" />
          <circle className="net-dot" cx="251" cy="74" r="4" />
          <circle className="net-dot dim" cx="308" cy="83" r="4" />
          <circle className="net-dot" cx="332" cy="156" r="4" />
          <circle className="net-dot dim" cx="399" cy="191" r="4" />
          <circle className="net-dot dim" cx="284" cy="245" r="4" />
          <circle className="core-ring" cx="200" cy="146" r="37" />
          <circle className="core-ring" cx="200" cy="146" r="28" />
          <path className="core-shield" d="M200 129l14 6v10c0 10-6 17-14 21-8-4-14-11-14-21v-10l14-6z" />
          <path className="core-shield" d="M194 145l4 4 8-9" />
          <text className="node-label" x="53" y="171">IDENTIDADE</text>
          <text className="node-label" x="276" y="267">PRÁTICA</text>
          <text className="node-label" x="280" y="61">COMPETÊNCIAS</text>
        </svg>
      </div>
      <div className="panel-footer">
        <span>PROTEGER · APRENDER · EVOLUIR</span>
        <span>AO / 01</span>
      </div>
    </div>
  );
}
