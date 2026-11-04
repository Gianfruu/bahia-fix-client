import { useMemo, useState } from "react";
import { demoClientes, demoEquipos } from "../data/demo-data.js";

const accounts = [
  { email: "admin@bahiafix.com", password: "Admin123", nombre: "Administrador", role: "Administrador", permissions: ["clientes", "turnos", "reparaciones", "usuarios"] },
  { email: "operador@bahiafix.com", password: "Operador123", nombre: "Operador", role: "Operador", permissions: ["clientes", "turnos", "reparaciones"] },
  { email: "tecnico@bahiafix.com", password: "Tecnico123", nombre: "Técnico", role: "Técnico", permissions: ["reparaciones"] }
];

const demoTurnos = [{ estado: "Solicitado" }, { estado: "Confirmado" }, { estado: "Solicitado" }];
const demoReparaciones = [{ estado: "Terminado" }, { estado: "En diagnóstico" }, { estado: "Presupuestado" }, { estado: "En reparación" }, { estado: "Recibido" }];

function AccessDashboard({ user = null, onLogin = () => {}, onLogout = () => {} }) {
  const [view, setView] = useState("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(() => [
    { label: "Clientes", value: demoClientes.length, detail: "Registrados" },
    { label: "Equipos", value: demoEquipos.length, detail: "En el sistema" },
    { label: "Turnos", value: demoTurnos.length, detail: "Programados" },
    { label: "Reparaciones", value: demoReparaciones.length, detail: "Órdenes de ejemplo" }
  ], []);

  function changeField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.email.trim() || (view !== "recuperar" && !form.password.trim())) {
      setError("Completá los datos obligatorios para continuar.");
      return;
    }

    if (view === "registro") {
      if (!form.nombre.trim()) {
        setError("Ingresá tu nombre para continuar.");
        return;
      }
      const registeredUser = {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        role: "Operador",
        permissions: ["clientes", "turnos", "reparaciones"]
      };
      onLogin(registeredUser);
      return;
    }

    if (view === "recuperar") {
      setMessage("Solicitud simulada correctamente. No se envió ningún correo real.");
      return;
    }

    const account = accounts.find((item) =>
      item.email.toLowerCase() === form.email.trim().toLowerCase() &&
      item.password === form.password
    );

    if (!account) {
      setError("Usuario o contraseña incorrectos. Revisá las cuentas de demostración.");
      return;
    }

    onLogin({
      nombre: account.nombre,
      email: account.email,
      role: account.role,
      permissions: account.permissions
    });
  }

  if (user) {
    return (
      <section className="workspace-section" id="panel" aria-labelledby="workspace-title">
        <div className="workspace-heading">
          <div><p className="eyebrow">PANEL GENERAL</p><h2 id="workspace-title">Resumen del taller</h2><p className="section-description">Sesión de demostración iniciada.</p></div>
          <span className="demo-label">{user.role}</span>
        </div>
        <div className="dashboard-grid">
          {stats.map((item) => <article className="dashboard-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></article>)}
        </div>
        <div className="access-panel" id="acceso">
          <div className="access-intro">
            <h3>Perfil de usuario</h3>
            <p><strong>Nombre:</strong> {user.nombre}</p>
            <p><strong>Correo:</strong> {user.email}</p>
            <p><strong>Perfil:</strong> {user.role}</p>
            <p className="demo-label">Autenticación simulada · Datos de demostración</p>
            <button type="button" className="secondary-button" onClick={onLogout}>Cerrar sesión</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-section access-gate" id="acceso" aria-labelledby="workspace-title">
      <div className="workspace-heading">
        <div><p className="eyebrow">BAHÍA FIX</p><h2 id="workspace-title">Acceso al sistema</h2><p className="section-description">Ingresá con una cuenta de demostración o registrá un usuario.</p></div>
        <span className="demo-label">Prototipo · Acceso simulado</span>
      </div>
      <div className="access-panel">
        <div className="access-tabs" aria-label="Acceso de usuario">
          <button type="button" className={view === "login" ? "active" : ""} onClick={() => { setView("login"); setError(""); setMessage(""); }}>Iniciar sesión</button>
          <button type="button" className={view === "registro" ? "active" : ""} onClick={() => { setView("registro"); setError(""); setMessage(""); }}>Registro</button>
          <button type="button" className={view === "recuperar" ? "active" : ""} onClick={() => { setView("recuperar"); setError(""); setMessage(""); }}>Recuperar contraseña</button>
        </div>
        <form className="access-form" onSubmit={submit}>
          <h3>{view === "login" ? "Iniciar sesión" : view === "registro" ? "Crear cuenta de demostración" : "Recuperar contraseña"}</h3>
          {view === "registro" && <label>Nombre completo<input name="nombre" value={form.nombre} onChange={changeField} required /></label>}
          <label>Correo electrónico<input name="email" type="email" value={form.email} onChange={changeField} required /></label>
          {view !== "recuperar" && <label>Contraseña<input name="password" type="password" value={form.password} onChange={changeField} required minLength="4" /></label>}
          {error && <p className="access-error" role="alert">{error}</p>}
          <div className="access-actions">
            <button className="primary-button" type="submit">{view === "login" ? "Ingresar" : view === "registro" ? "Registrarme" : "Enviar solicitud"}</button>
            {view === "login" && <button className="secondary-button" type="button" onClick={() => { setView("recuperar"); setError(""); }}>Olvidé mi contraseña</button>}
          </div>
        </form>
        {message && <p className="access-message" role="status">{message}</p>}
        {view === "login" && (
          <div className="access-intro demo-accounts">
            <h3>Cuentas de demostración</h3>
            <p><strong>Administrador:</strong> admin@bahiafix.com / Admin123</p>
            <p><strong>Operador:</strong> operador@bahiafix.com / Operador123</p>
            <p><strong>Técnico:</strong> tecnico@bahiafix.com / Tecnico123</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AccessDashboard;
