"use client";

import { motion, type Variants } from "motion/react";
import Link from "next/link";
import { useWatch } from "react-hook-form";

import { ControlledInput } from "@/components/atoms/ControlledInput";
import { InteractiveHoverButton } from "@/components/atoms/InteractiveHoverButton";
import { PasswordStrengthMeter } from "@/components/molecules/PasswordStrengthMeter";
import { SIGNUP_MESSAGES, useSignupForm } from "@/hooks/useSignupForm";

const LOGIN_HREF = "/login";
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

export function SignupForm() {
  const { control, onSubmit, status } = useSignupForm();
  const passwordValue = useWatch({ control, name: "password" });

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
            name="name"
            type="text"
            label={SIGNUP_MESSAGES.nameLabel}
            autoComplete="name"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ControlledInput
            control={control}
            name="email"
            type="email"
            label={SIGNUP_MESSAGES.emailLabel}
            autoComplete="email"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-3">
          <ControlledInput
            control={control}
            name="password"
            type="password"
            label={SIGNUP_MESSAGES.passwordLabel}
            autoComplete="new-password"
            showPasswordToggle
          />
          <PasswordStrengthMeter value={passwordValue ?? ""} />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <motion.div variants={itemVariants}>
          <InteractiveHoverButton
            type="submit"
            status={status}
            text={SIGNUP_MESSAGES.submit}
            loadingText={SIGNUP_MESSAGES.submitting}
            successText={SUCCESS_LABEL}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <Link
            href={LOGIN_HREF}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {SIGNUP_MESSAGES.alreadyHaveAccount}
          </Link>
        </motion.div>
      </div>
    </motion.form>
  );
}

export default SignupForm;
