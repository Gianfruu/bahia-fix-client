function App() {
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Bahía Fix, inicio">
          <span className="brand-mark">BF</span>
          <span>Bahía Fix</span>
        </a>
        <span className="prototype-label">Prototipo de gestión</span>
      </header>

      <main className="main-content">
        <section className="welcome-card">
          <p className="eyebrow">GESTIÓN DE TALLER</p>
          <h1>Bienvenido a Bahía Fix</h1>
          <p className="intro">
            Un espacio para organizar turnos, clientes, equipos y reparaciones
            de herramientas eléctricas y equipos de combustión.
          </p>
          <div className="status">
            <span className="status-dot" />
            Prueba
          </div>
        </section>

        <section className="module-section" aria-labelledby="modules-title">
          <div className="section-heading">
            <p className="eyebrow">MÓDULOS DEL SISTEMA</p>
            <h2 id="modules-title">Todo organizado en un solo lugar</h2>
          </div>
          <div className="module-grid">
            <article className="module-card">
              <span className="module-icon">01</span>
              <h3>Clientes y equipos</h3>
              <p>Datos de clientes y herramientas ingresadas al taller.</p>
              <span className="module-status">Próximamente</span>
            </article>
            <article className="module-card">
              <span className="module-icon">02</span>
              <h3>Turnos</h3>
              <p>Organización de solicitudes y recepción de equipos.</p>
              <span className="module-status">Próximamente</span>
            </article>
            <article className="module-card">
              <span className="module-icon">03</span>
              <h3>Reparaciones</h3>
              <p>Diagnósticos, presupuestos y seguimiento del trabajo.</p>
              <span className="module-status">Próximamente</span>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Bahía Fix · Proyecto Final</span>
      </footer>
    </div>
  );
}

export default App;
