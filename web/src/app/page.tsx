"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { HeroShutterText } from "@/components/atoms/HeroShutterText";
import { MotionButton } from "@/components/atoms/MotionButton";

const SUBTITLE = "Assistente financeiro · voz e IA";
const CTA_LABEL = "Entrar";
const CTA_HREF = "/login";
const SIGNUP_LABEL = "Cadastrar";
const SIGNUP_HREF = "/signup";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-14 px-6 py-12">
      <div className="flex flex-col items-center gap-4">
        <HeroShutterText text="MONETA" href={CTA_HREF} />
        <motion.p
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
          className="text-xs uppercase tracking-[0.25em] text-muted-foreground/70"
        >
          {SUBTITLE}
        </motion.p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <MotionButton label={CTA_LABEL} href={CTA_HREF} />
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6, ease: "easeOut" }}
        >
          <Link
            href={SIGNUP_HREF}
            className="text-xs uppercase tracking-[0.25em] text-muted-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {SIGNUP_LABEL}
          </Link>
        </motion.div>
      </div>

    </main>
  );
}
