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

export const LOGIN_MESSAGES = {
  emailInvalid: "E-mail inválido",
  emailRequired: "E-mail é obrigatório",
  passwordRequired: "Senha é obrigatória",
  passwordMin: "Senha precisa ter no mínimo 8 caracteres",
  submit: "Entrar",
  submitting: "Entrando…",
  successToast: "Login efetuado com sucesso",
  errorToast: "Não rolou entrar. Confere as credenciais e tenta de novo.",
  emailLabel: "E-mail",
  passwordLabel: "Senha",
  title: "Entrar na Moneta",
  subtitle: "Acesse sua conta pra continuar",
  forgotPassword: "Esqueci minha senha",
} as const;

const loginSchema = z.object({
  email: z.email({
    error: (issue) =>
      issue.input === "" || issue.input === undefined
        ? LOGIN_MESSAGES.emailRequired
        : LOGIN_MESSAGES.emailInvalid,
  }),
  password: z
    .string({ error: LOGIN_MESSAGES.passwordRequired })
    .min(8, LOGIN_MESSAGES.passwordMin),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const router = useRouter();
  const auth = authHooks.use();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    resolver: standardSchemaResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { user } = await auth.login.mutateAsync(values);
      toast.success(LOGIN_MESSAGES.successToast);
      setIsSuccess(true);
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_HOLD_MS));
      const destination = user.onboardedAt ? "/" : "/onboarding";
      router.push(destination);
    } catch {
      toast.error(LOGIN_MESSAGES.errorToast);
    }
  });

  const status: InteractiveHoverButtonStatus = (() => {
    if (isSuccess) return "success";
    if (auth.login.isPending) return "loading";
    return "idle";
  })();

  return {
    control: form.control,
    setValue: form.setValue,
    onSubmit,
    isPending: auth.login.isPending,
    status,
  };
}
