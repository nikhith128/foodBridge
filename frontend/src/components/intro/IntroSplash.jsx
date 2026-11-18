import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { introState } from "./introState.js";

const KEY = "fb_intro_seen";
const SHOW_MS = 1000;

function canShow() {
  try {
    if (window.location.pathname !== "/") return false;
    if (sessionStorage.getItem(KEY)) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  } catch {
    return false;
  }
}

introState.plays = canShow();

export default function IntroSplash({ onDone }) {
  const [show, setShow] = useState(introState.plays);

  const close = () => {
    introState.plays = false;
    document.documentElement.classList.remove("fb-intro");
    setShow(false);
  };

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    const timer = setTimeout(close, SHOW_MS);
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [show]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "#003422", willChange: "opacity" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          onClick={close}
        >
          <motion.div
            className="flex items-center gap-3"
          >
            <motion.div
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Leaf className="h-10 w-10" style={{ color: "#b8efd0" }} />
            </motion.div>
            <motion.span
              className="text-3xl font-semibold text-white"
              style={{ willChange: "transform, opacity" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              FoodBridge AI
            </motion.span>
          </motion.div>
          <button
            type="button"
            onClick={close}
            className="absolute bottom-6 right-6 rounded-full px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
