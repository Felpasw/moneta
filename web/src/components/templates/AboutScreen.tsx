"use client";

import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";

import { ShutterText } from "@/components/atoms/ShutterText";
import type { AboutScreenProps } from "@/components/templates/interfaces/AboutScreen.interface";

interface AboutLink {
  href: string;
  label: string;
}

const SITE_LINK: AboutLink = {
  href: "https://moneta.felipeclacerda.com",
  label: "moneta.felipeclacerda.com",
};

const PORTFOLIO_LINK: AboutLink = {
  href: "https://felipeclacerda.com",
  label: "felipeclacerda.com",
};

const TITLE_TEXT = "MONETA";
const TITLE_SIZE_CLASS = "text-[clamp(3rem,14vw,10rem)]";

const DESCRIPTION =
  "The conversational way to handle your money. Talk, type, or tap — Moneta listens, understands, and keeps cards, invoices, income, and expenses in one place. No spreadsheets, no menus, at the pace of a conversation.";

export function AboutScreen({ versions }: AboutScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <ShutterText text={TITLE_TEXT} textSizeClass={TITLE_SIZE_CLASS} />
      <p aria-hidden className="sr-only">
        {TITLE_TEXT}
      </p>

      <motion.dl
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        aria-label="App versions"
        className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest text-muted-foreground"
      >
        <div className="flex items-center gap-1.5">
          <dt>web</dt>
          <dd>v{versions.web}</dd>
        </div>
        <span aria-hidden className="opacity-50">
          ·
        </span>
        <div className="flex items-center gap-1.5">
          <dt>api</dt>
          <dd>v{versions.api}</dd>
        </div>
      </motion.dl>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="max-w-xl text-sm leading-relaxed text-muted-foreground"
      >
        {DESCRIPTION}
      </motion.p>

      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        aria-label="Moneta links"
        className="flex flex-col items-center gap-3 sm:flex-row"
      >
        <a
          href={SITE_LINK.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <span>{SITE_LINK.label}</span>
          <ExternalLink
            aria-hidden
            className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </a>
        <a
          href={PORTFOLIO_LINK.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-dashed border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span>{PORTFOLIO_LINK.label}</span>
          <ExternalLink
            aria-hidden
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </a>
      </motion.nav>
    </main>
  );
}

export default AboutScreen;
