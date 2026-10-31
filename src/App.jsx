import SiteHeader from "./components/SiteHeader.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import ClientesEquipos from "./pages/ClientesEquipos.jsx";

const modules = [
  { id: "clientes-equipos-card", number: "01", title: "Clientes y equipos", description: "Consultá la información de clientes y los equipos ingresados al taller.", status: "Disponible", href: "#clientes-equipos", available: true },
  { id: "turnos", number: "02", title: "Turnos", description: "Organizá las solicitudes de atención y la recepción de equipos.", status: "En preparación", href: "#turnos", available: false },
  { id: "reparaciones", number: "03", title: "Reparaciones", description: "Centralizá diagnósticos, presupuestos y seguimiento de los trabajos.", status: "En preparación", href: "#reparaciones", available: false }
];

function App() {
  return (
    <div className="app-shell" id="inicio">
      <SiteHeader />
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">ADMINISTRACIÓN DE TALLER</p>
            <h1>El trabajo del taller, <span>mejor organizado.</span></h1>
            <p className="hero-description">Gestioná clientes, equipos, turnos y reparaciones desde un único espacio de trabajo.</p>
            <a className="primary-link" href="#modulos">Explorar módulos <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-ring art-ring-large" />
            <div className="art-ring art-ring-small" />
            <div className="tool-card">
              <span className="tool-card-label">BAHÍA FIX</span>
              <span className="tool-card-symbol">BF</span>
              <span className="tool-card-caption">Gestión integral</span>
            </div>
            <div className="floating-chip chip-top"><span className="chip-dot" />Organización</div>
            <div className="floating-chip chip-bottom">Clientes · Taller · Servicio</div>
          </div>
        </section>

        <section className="modules-section" id="modulos" aria-labelledby="modules-title">
          <div className="section-heading">
            <div><p className="eyebrow">ESPACIO DE TRABAJO</p><h2 id="modules-title">Módulos principales</h2></div>
            <p className="section-description">Una estructura clara para acompañar cada etapa del servicio.</p>
          </div>
          <div className="module-grid">
            {modules.map((module) => (
              <article className={`module-card ${module.available ? "module-card-available" : ""}`} id={module.id} key={module.id}>
                <div className="module-card-top"><span className="module-number">{module.number}</span><span className="module-arrow" aria-hidden="true">↗</span></div>
                <h3>{module.title}</h3><p>{module.description}</p>
                <div className="module-card-bottom"><span className={`module-status-dot ${module.available ? "module-status-active" : ""}`} /><span>{module.status}</span></div>
                {module.available && <a className="module-card-action" href={module.href}>Abrir módulo <span aria-hidden="true">→</span></a>}
              </article>
            ))}
          </div>
        </section>

        <ClientesEquipos />
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
