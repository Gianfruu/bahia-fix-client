import { useState } from "react";
import SiteHeader from "./components/SiteHeader.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import MainNavigation from "./components/MainNavigation.jsx";
import ClientesEquipos from "./pages/ClientesEquipos.jsx";
import Turnos from "./pages/Turnos.jsx";
import Reparaciones from "./pages/Reparaciones.jsx";
import AccessDashboard from "./pages/AccessDashboard.jsx";

const modules = [
  { id: "clientes-equipos-card", number: "01", title: "Clientes y equipos", description: "Consultá la información de clientes y equipos ingresados al taller.", href: "#clientes-equipos", permission: "clientes" },
  { id: "turnos-card", number: "02", title: "Turnos", description: "Organizá las solicitudes de atención y la recepción de equipos.", href: "#turnos", permission: "turnos" },
  { id: "reparaciones-card", number: "03", title: "Reparaciones", description: "Centralizá diagnósticos, presupuestos y seguimiento de los trabajos.", href: "#reparaciones", permission: "reparaciones" }
];

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bahiaFixUser")) || null;
    } catch {
      return null;
    }
  });

  function handleLogin(nextUser) {
    sessionStorage.setItem("bahiaFixUser", JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function handleLogout() {
    sessionStorage.removeItem("bahiaFixUser");
    setUser(null);
  }

  if (!user) {
    return (
      <div className="app-shell access-only">
        <AccessDashboard onLogin={handleLogin} />
      </div>
    );
  }

  const permissions = user.permissions || [];
  const canSee = (permission) => permissions.includes(permission);

  return (
    <div className="app-shell" id="inicio">
      <SiteHeader />
      <MainNavigation user={user} onLogout={handleLogout} />
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
            <div className="tool-card"><span className="tool-card-label">BAHÍA FIX</span><span className="tool-card-symbol">BF</span><span className="tool-card-caption">Gestión integral</span></div>
            <div className="floating-chip chip-top"><span className="chip-dot" />Organización</div>
            <div className="floating-chip chip-bottom">Clientes · Taller · Servicio</div>
          </div>
        </section>

        <AccessDashboard user={user} onLogout={handleLogout} />

        <section className="modules-section" id="modulos" aria-labelledby="modules-title">
          <div className="section-heading">
            <div><p className="eyebrow">ESPACIO DE TRABAJO</p><h2 id="modules-title">Módulos principales</h2></div>
            <p className="section-description">Accesos disponibles para el perfil {user.role}.</p>
          </div>
          <div className="module-grid">
            {modules.filter((module) => canSee(module.permission)).map((module) => (
              <article className="module-card module-card-available" id={module.id} key={module.id}>
                <div className="module-card-top"><span className="module-number">{module.number}</span><span className="module-arrow" aria-hidden="true">↗</span></div>
                <h3>{module.title}</h3><p>{module.description}</p>
                <div className="module-card-bottom"><span className="module-status-dot module-status-active" /><span>Disponible</span></div>
                <a className="module-card-action" href={module.href}>Abrir módulo <span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
        </section>

        {canSee("clientes") && <ClientesEquipos />}
        {canSee("turnos") && <Turnos />}
        {canSee("reparaciones") && <Reparaciones role={user.role} />}
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
