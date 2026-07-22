"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BackLinkProps {
  href: string;
  label?: string;
  className?: string;
}

const DEFAULT_LABEL = "Voltar";

export function BackLink({ href, label = DEFAULT_LABEL, className }: BackLinkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("self-start", className)}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </Link>
    </motion.div>
  );
}

export default BackLink;
