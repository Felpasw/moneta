"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { BarLoader } from "@/components/atoms/BarLoader";
import { MicButton } from "@/components/atoms/MicButton";
import { TalkingAssistantAvatar } from "@/components/atoms/TalkingAssistantAvatar";
import { MicState, useAgentSession } from "@/hooks/useAgentSession";
import assistantProfileHooks from "@/hooks/useAssistantProfile";
import { agentSessionActions } from "@/stores/agentSessionStore";
import { useUserStore } from "@/stores/userStore";

const MIC_DENIED_TOAST =
  "Permita o microfone nas configurações do navegador pra conversar com a Moneta.";
const MIC_ERROR_TOAST = "Não consegui abrir seu microfone.";
const FALLBACK_SEED = "usuario";

export function DashboardScreen() {
  const { audioElement, isWarming, micState } = useAgentSession({
    enabled: true,
  });
  const { profile } = assistantProfileHooks.use();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (micState !== MicState.Denied && micState !== MicState.Error) return;
    const message =
      micState === MicState.Denied ? MIC_DENIED_TOAST : MIC_ERROR_TOAST;
    toast.error(message);
    queueMicrotask(() => agentSessionActions.setMicEnabled(false));
  }, [micState]);

  const fallbackSeed = user?.name ?? FALLBACK_SEED;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="relative flex size-48 items-center justify-center sm:size-56">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/10 blur-2xl"
        />
        <TalkingAssistantAvatar
          avatarUrl={profile.data?.avatarUrl ?? null}
          audioElement={audioElement}
          fallbackSeed={fallbackSeed}
          className="relative h-40 w-40 sm:h-48 sm:w-48"
        />
      </div>
      {isWarming ? (
        <BarLoader />
      ) : (
        <MicButton state={micState} onToggle={agentSessionActions.toggleMic} />
      )}
    </main>
  );
}

export default DashboardScreen;
