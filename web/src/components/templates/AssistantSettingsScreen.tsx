"use client";

import { toast } from "sonner";

import { AssistantAvatar } from "@/components/atoms/AssistantAvatar";
import { RippleLoader } from "@/components/atoms/RippleLoader";
import { AssistantSettingsAvatar } from "@/components/organisms/AssistantSettingsAvatar";
import { AssistantSettingsTreatmentStyle } from "@/components/organisms/AssistantSettingsTreatmentStyle";
import { AssistantSettingsVoice } from "@/components/organisms/AssistantSettingsVoice";
import assistantProfileHooks from "@/hooks/useAssistantProfile";
import type {
  TreatmentStyle,
  UpdateProfilePatch,
} from "@/services/interfaces/assistantProfile.interface";
import { useUserStore } from "@/stores/userStore";

const TOAST_SUCCESS_MESSAGE = "Preferências atualizadas.";
const TOAST_ERROR_MESSAGE = "Não deu pra salvar. Tenta de novo.";
const FALLBACK_SEED = "usuario";

export function AssistantSettingsScreen() {
  const { profile, voices, previewVoice, updateProfile } =
    assistantProfileHooks.use();
  const user = useUserStore((s) => s.user);

  const isLoading = profile.isLoading || voices.isLoading;
  const hasError = profile.isError || (profile.data === undefined && !profile.isLoading);

  const patch = (input: UpdateProfilePatch) => {
    updateProfile.mutate(input, {
      onSuccess: () => toast.success(TOAST_SUCCESS_MESSAGE),
      onError: () => toast.error(TOAST_ERROR_MESSAGE),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <RippleLoader label="Carregando preferências do assistente" />
      </div>
    );
  }

  if (hasError || profile.data === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Não foi possível carregar suas preferências. Tenta de novo daqui a
        pouco.
      </div>
    );
  }

  const currentProfile = profile.data;
  const defaultSeed = user?.name ?? FALLBACK_SEED;
  const mutationPending = updateProfile.isPending;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-8">
      <section
        aria-label="Prévia do assistente"
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/10 blur-2xl"
          />
          <AssistantAvatar
            avatarUrl={currentProfile.avatarUrl}
            size="lg"
            fallbackSeed={defaultSeed}
            className="relative h-40 w-40 ring-4 ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-semibold">
            Personalização do assistente
          </h1>
          <p className="text-sm text-muted-foreground">
            Ajuste o tom, a voz e o avatar do seu assistente financeiro.
          </p>
        </div>
      </section>

      <AssistantSettingsTreatmentStyle
        value={currentProfile.treatmentStyle}
        onChange={(next: TreatmentStyle) => patch({ treatmentStyle: next })}
        disabled={mutationPending}
      />

      <AssistantSettingsVoice
        voices={voices.data ?? []}
        selectedVoiceId={currentProfile.voiceId}
        onSelect={(voiceId) => patch({ voiceId })}
        onPreview={(voiceId) => previewVoice.mutateAsync(voiceId)}
        disabled={mutationPending}
      />

      <AssistantSettingsAvatar
        avatarUrl={currentProfile.avatarUrl}
        defaultSeed={defaultSeed}
        onChange={(avatarUrl) => patch({ avatarUrl })}
        disabled={mutationPending}
      />
    </main>
  );
}

export default AssistantSettingsScreen;
