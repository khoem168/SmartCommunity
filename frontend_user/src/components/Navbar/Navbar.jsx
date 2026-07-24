import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navlink from "./NavLink";
import logo from "../../assets/logo/logo1.png";
import "./navbar.css";
import { useGlobleContext } from "../../context/GlobleContext";
import { NavProfile } from "./NavProfile";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useGlobleContext();
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <div className="navbar-logo">
          <Link to="/" aria-label="Smart Community home">
            <img src={logo} alt="Smart Community logo" />
          </Link>
        </div>

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`nav-content ${menuOpen ? "open" : ""}`}
          onClick={(event) => {
            if (event.target.closest("a")) setMenuOpen(false);
          }}
        >
          <Navlink />
          <div className="auth-actions">
            {isAuthenticated ? (
              <NavProfile user={user} onLogout={logout} />
            ) : (
              <>
                <Link className="btn nav-btn outline" to="/login">
                  Log in
                </Link>
                <Link className="btn nav-btn primary" to="/register">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
