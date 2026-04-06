import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // browser scroll restore disable
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // force scroll top
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;