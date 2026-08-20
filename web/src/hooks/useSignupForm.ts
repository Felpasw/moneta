"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";

import type { InteractiveHoverButtonStatus } from "@/components/atoms/InteractiveHoverButton";
import authHooks from "@/hooks/useAuth";

const SUCCESS_HOLD_MS = 700;

export const SIGNUP_MESSAGES = {
  nameRequired: "Name is required",
  nameMax: "Name must be at most 100 characters",
  emailInvalid: "Invalid email",
  emailRequired: "Email is required",
  passwordRequired: "Password is required",
  passwordMin: "Password must be at least 8 characters",
  passwordMax: "Password must be at most 128 characters",
  submit: "Sign up",
  submitting: "Signing up…",
  successToast: "Account created! You're signed in.",
  errorToast: "Couldn't sign up. Check the info and try again.",
  emailInUseToast: "That email already has an account. Sign in instead?",
  nameLabel: "Name",
  emailLabel: "Email",
  passwordLabel: "Password",
  alreadyHaveAccount: "Already have an account? Sign in",
} as const;

const signupSchema = z.object({
  name: z
    .string({ error: SIGNUP_MESSAGES.nameRequired })
    .trim()
    .min(1, SIGNUP_MESSAGES.nameRequired)
    .max(100, SIGNUP_MESSAGES.nameMax),
  email: z.email({
    error: (issue) =>
      issue.input === "" || issue.input === undefined
        ? SIGNUP_MESSAGES.emailRequired
        : SIGNUP_MESSAGES.emailInvalid,
  }),
  password: z
    .string({ error: SIGNUP_MESSAGES.passwordRequired })
    .min(8, SIGNUP_MESSAGES.passwordMin)
    .max(128, SIGNUP_MESSAGES.passwordMax),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

function isConflictError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const withResponse = error as { response?: { status?: number } };
  return withResponse.response?.status === 409;
}

export function useSignupForm() {
  const router = useRouter();
  const auth = authHooks.use();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SignupFormValues>({
    defaultValues: { name: "", email: "", password: "" },
    resolver: standardSchemaResolver(signupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await auth.signup.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      await auth.login.mutateAsync({
        email: values.email,
        password: values.password,
      });
      toast.success(SIGNUP_MESSAGES.successToast);
      setIsSuccess(true);
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_HOLD_MS));
      router.push("/onboarding");
    } catch (error) {
      const message = isConflictError(error)
        ? SIGNUP_MESSAGES.emailInUseToast
        : SIGNUP_MESSAGES.errorToast;
      toast.error(message);
    }
  });

  const status: InteractiveHoverButtonStatus = (() => {
    if (isSuccess) return "success";
    if (auth.signup.isPending || auth.login.isPending) return "loading";
    return "idle";
  })();

  return {
    control: form.control,
    setValue: form.setValue,
    onSubmit,
    isPending: auth.signup.isPending || auth.login.isPending,
    status,
  };
}
