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
  nameRequired: "Nome é obrigatório",
  nameMax: "Nome deve ter no máximo 100 caracteres",
  emailInvalid: "E-mail inválido",
  emailRequired: "E-mail é obrigatório",
  passwordRequired: "Senha é obrigatória",
  passwordMin: "Senha precisa ter no mínimo 8 caracteres",
  passwordMax: "Senha deve ter no máximo 128 caracteres",
  submit: "Cadastrar",
  submitting: "Cadastrando…",
  successToast: "Conta criada! Já tá logado.",
  errorToast: "Não rolou cadastrar. Verifica os dados e tenta de novo.",
  emailInUseToast: "Esse e-mail já tem conta. Bora fazer login?",
  nameLabel: "Nome",
  emailLabel: "E-mail",
  passwordLabel: "Senha",
  alreadyHaveAccount: "Já tem conta? Entrar",
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
