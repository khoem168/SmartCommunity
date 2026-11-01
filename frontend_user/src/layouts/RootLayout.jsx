import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer";
import TabBar from "../components/Navbar/TabBar";
import { FaChevronUp } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import ScrollEngagementPopup from "../components/ScrollEngagementPopup";
import RealtimeToastHub from "../components/ui/RealtimeToastHub";
import CommandPalette from "../components/ui/CommandPalette";

const RootLayout = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const scrollUpPage = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "instant" : "smooth",
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
      <div className="bg-blobs" aria-hidden="true">
        <i className="blob b1" />
        <i className="blob b2" />
        <i className="blob b3" />
      </div>

      <a className="skip-link" href="#main-content">
        {t("common.skipContent")}
      </a>
      <Navbar />
      <div className="app-content" id="main-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="route-transition"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.24, ease: [0.2, 0.75, 0.25, 1] }
            }
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
      <TabBar />
      <CommandPalette />
      <RealtimeToastHub />
      <ScrollEngagementPopup />
      {showButton && (
        <button
          type="button"
          className="scroll-up"
          onClick={scrollUpPage}
          aria-label={t("common.scrollTop")}
        >
          <FaChevronUp size={17} />
        </button>
      )}
    </div>
  );
};
export default RootLayout;
