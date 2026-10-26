const navigationItems = [
  { label: "Inicio", href: "#inicio" },
  { label: "Clientes y equipos", href: "#clientes-equipos" },
  { label: "Turnos", href: "#turnos" },
  { label: "Reparaciones", href: "#reparaciones" }
];

function MainNavigation() {
  return (
    <nav className="main-navigation" aria-label="Navegación principal">
      {navigationItems.map((item) => (
        <a className="navigation-link" href={item.href} key={item.href}>{item.label}</a>
      ))}
    </nav>
  );
}
export default MainNavigation;
