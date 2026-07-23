"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OnboardingHero } from "@/components/organisms/OnboardingHero";
import { OnboardingProgress } from "@/components/organisms/OnboardingProgress";
import { MicState, useAgentSession } from "@/hooks/useAgentSession";

const MIC_DENIED_TOAST =
  "Permita o microfone nas configurações do navegador pra conversar com a Moneta.";
const MIC_ERROR_TOAST = "Não consegui abrir seu microfone.";

export function OnboardingScreen() {
  const [micEnabled, setMicEnabled] = useState(false);
  const { audioElement, isWarming, micStream, micState, toolEvents } =
    useAgentSession({ enabled: true, micEnabled });

  useEffect(() => {
    if (micState !== MicState.Denied && micState !== MicState.Error) return;
    const message =
      micState === MicState.Denied ? MIC_DENIED_TOAST : MIC_ERROR_TOAST;
    toast.error(message);
    queueMicrotask(() => setMicEnabled(false));
  }, [micState]);

  const handleMicToggle = (): void => setMicEnabled((prev) => !prev);

  return (
    <div className="flex min-h-screen flex-col">
      <OnboardingHero
        audioElement={audioElement}
        micStream={micStream}
        micState={micState}
        isWarming={isWarming}
        onMicToggle={handleMicToggle}
      />
      <OnboardingProgress
        toolEvents={toolEvents}
        className="mx-auto mb-16 w-full max-w-md px-6"
      />
    </div>
  );
}

export default OnboardingScreen;
