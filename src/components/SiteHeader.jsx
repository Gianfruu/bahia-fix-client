import Brand from "./Brand.jsx";
import MainNavigation from "./MainNavigation.jsx";

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <MainNavigation />
        <span className="header-status"><span className="status-indicator" />Gestión de taller</span>
      </div>
    </header>
  );
}
export default SiteHeader;
