"use client";

import { motion, type Variants } from "motion/react";
import Link from "next/link";

import { ControlledInput } from "@/components/atoms/ControlledInput";
import { InteractiveHoverButton } from "@/components/atoms/InteractiveHoverButton";
import { LOGIN_MESSAGES, useLoginForm } from "@/hooks/useLoginForm";

const FORGOT_PASSWORD_HREF = "/forgot-password";
const SUCCESS_LABEL = "Beleza!";

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function LoginForm() {
  const { control, onSubmit, status } = useLoginForm();

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      className="w-full max-w-sm space-y-8"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <div className="space-y-8">
        <motion.div variants={itemVariants}>
          <ControlledInput
            control={control}
            name="email"
            type="email"
            label={LOGIN_MESSAGES.emailLabel}
            autoComplete="email"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ControlledInput
            control={control}
            name="password"
            type="password"
            label={LOGIN_MESSAGES.passwordLabel}
            autoComplete="current-password"
            showPasswordToggle
          />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <motion.div variants={itemVariants}>
          <InteractiveHoverButton
            type="submit"
            status={status}
            text={LOGIN_MESSAGES.submit}
            loadingText={LOGIN_MESSAGES.submitting}
            successText={SUCCESS_LABEL}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <Link
            href={FORGOT_PASSWORD_HREF}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {LOGIN_MESSAGES.forgotPassword}
          </Link>
        </motion.div>
      </div>
    </motion.form>
  );
}

export default LoginForm;
