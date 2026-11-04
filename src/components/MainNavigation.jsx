const navigationItems = [
  { label: "Inicio", href: "#inicio", permission: "inicio" },
  { label: "Panel y perfil", href: "#panel", permission: "inicio" },
  { label: "Clientes y equipos", href: "#clientes-equipos", permission: "clientes" },
  { label: "Turnos", href: "#turnos", permission: "turnos" },
  { label: "Reparaciones", href: "#reparaciones", permission: "reparaciones" }
];

function MainNavigation({ user = null, onLogout = () => {} }) {
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions
    : ["clientes", "turnos", "reparaciones"];

  return (
    <nav className="main-navigation" aria-label="Navegación principal">
      {navigationItems
        .filter((item) => item.permission === "inicio" || permissions.includes(item.permission))
        .map((item) => (
          <a className="navigation-link" href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      {user && (
        <>
          <span className="navigation-user">
            {user.nombre} · {user.role || "Usuario"}
          </span>
          <button type="button" className="navigation-link" onClick={onLogout}>
            Cerrar sesión
          </button>
        </>
      )}
    </nav>
  );
}

export default MainNavigation;
