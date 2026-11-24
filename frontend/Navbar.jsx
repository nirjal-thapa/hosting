import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">Inventory</span>
        <nav className="nav-links">
          <NavLink to="/read" className="nav-link">
            Products
          </NavLink>
          <NavLink to="/create" className="nav-link">
            New product
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
