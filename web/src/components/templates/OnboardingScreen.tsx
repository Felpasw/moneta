"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OnboardingHero } from "@/components/organisms/OnboardingHero";
import { OnboardingProgress } from "@/components/organisms/OnboardingProgress";
import { MicState, useAgentSession } from "@/hooks/useAgentSession";
import {
  buildOnboardingSummary,
  deriveActiveStep,
} from "@/utils/onboardingProgress";

const MIC_DENIED_TOAST =
  "Permita o microfone nas configurações do navegador pra conversar com a Moneta.";
const MIC_ERROR_TOAST = "Não consegui abrir seu microfone.";

export function OnboardingScreen() {
  const [micEnabled, setMicEnabled] = useState(false);
  const { audioElement, isWarming, micStream, micState, toolEvents } =
    useAgentSession({ enabled: true, micEnabled });

  const activeStep = useMemo(
    () => deriveActiveStep(toolEvents),
    [toolEvents],
  );
  const summary = useMemo(
    () => buildOnboardingSummary(toolEvents),
    [toolEvents],
  );
  const hasProgress =
    summary.nickname !== null ||
    summary.banks.length > 0 ||
    summary.isComplete;

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
      {hasProgress && (
        <OnboardingProgress
          toolEvents={toolEvents}
          className="mx-auto mt-10 w-full max-w-2xl flex-1 px-6"
        />
      )}
      <OnboardingHero
        audioElement={audioElement}
        micStream={micStream}
        micState={micState}
        isWarming={isWarming}
        onMicToggle={handleMicToggle}
        activeStep={activeStep}
        compact={hasProgress}
      />
    </div>
  );
}

export default OnboardingScreen;
