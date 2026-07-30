import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer";
import { FaChevronUp } from "react-icons/fa";
import { useEffect, useState } from "react";

const RootLayout = () => {
  const location = useLocation();
  const scrollUpPage = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Navbar />
      <div className="app-content" id="main-content">
        <Outlet />
      </div>
      <Footer />
      {showButton && (
        <button
          type="button"
          className="scroll-up"
          onClick={scrollUpPage}
          aria-label="Scroll to top"
        >
          <FaChevronUp size={17} />
        </button>
      )}
    </div>
  );
};
export default RootLayout;
