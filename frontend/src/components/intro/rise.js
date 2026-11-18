import { introState } from "./introState.js";

export const rise = (i = 0) => {
  if (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return {};
  }
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: (introState.plays ? 1.3 : 0.05) + i * 0.1,
    },
  };
};
