"use client";

import { motion } from "motion/react";

const POWERED_BY_LABEL = "powered by";
const AUTHOR_LABEL = "felpasw";
const AUTHOR_HREF = "https://felipeclacerda.com";

export function PoweredByFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 0.8, ease: "easeOut" }}
      className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 px-4 text-center text-[10px] uppercase tracking-[0.3em] text-white"
    >
      <span className="pointer-events-auto">
        {POWERED_BY_LABEL}{" "}
        <a
          href={AUTHOR_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white underline-offset-4 transition-opacity hover:opacity-80 focus-visible:underline focus-visible:outline-none"
        >
          {AUTHOR_LABEL}
        </a>
      </span>
    </motion.footer>
  );
}

export default PoweredByFooter;
