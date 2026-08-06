"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { AssistantAvatar } from "@/components/atoms/AssistantAvatar";
import { RippleLoader } from "@/components/atoms/RippleLoader";
import { AssistantSettingsAvatar } from "@/components/organisms/AssistantSettingsAvatar";
import { AssistantSettingsTreatmentStyle } from "@/components/organisms/AssistantSettingsTreatmentStyle";
import { AssistantSettingsVoice } from "@/components/organisms/AssistantSettingsVoice";
import { Tabs } from "@/components/ui/Tabs";
import assistantProfileHooks from "@/hooks/useAssistantProfile";
import type {
  TreatmentStyle,
  UpdateProfilePatch,
} from "@/services/interfaces/assistantProfile.interface";
import { useUserStore } from "@/stores/userStore";
import {
  SETTINGS_STAGGER_CONTAINER,
} from "@/utils/settingsStagger";

const TOAST_SUCCESS_MESSAGE = "Preferences updated.";
const TOAST_ERROR_MESSAGE = "Couldn't save. Try again.";
const FALLBACK_SEED = "user";

const TAB_ID = {
  TONE: "tone",
  VOICE: "voice",
  AVATAR: "avatar",
} as const;

type TabId = (typeof TAB_ID)[keyof typeof TAB_ID];

const TABS: { id: TabId; label: string }[] = [
  { id: TAB_ID.TONE, label: "Tone" },
  { id: TAB_ID.VOICE, label: "Voice" },
  { id: TAB_ID.AVATAR, label: "Avatar" },
];

export function AssistantSettingsScreen() {
  const { profile, voices, previewVoice, updateProfile } =
    assistantProfileHooks.use();
  const user = useUserStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabId>(TAB_ID.TONE);

  const isLoading = profile.isLoading || voices.isLoading;
  const hasError =
    profile.isError || (profile.data === undefined && !profile.isLoading);

  const patch = (input: UpdateProfilePatch) => {
    updateProfile.mutate(input, {
      onSuccess: () => toast.success(TOAST_SUCCESS_MESSAGE),
      onError: () => toast.error(TOAST_ERROR_MESSAGE),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <RippleLoader label="Loading assistant preferences" />
      </div>
    );
  }

  if (hasError || profile.data === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Couldn&apos;t load your preferences. Try again in a bit.
      </div>
    );
  }

  const currentProfile = profile.data;
  const defaultSeed = user?.name ?? FALLBACK_SEED;
  const mutationPending = updateProfile.isPending;

  return (
    <main className="mx-auto flex min-h-full max-w-[1600px] flex-1 flex-col justify-center gap-8 px-4 py-8">
      <section
        aria-label="Assistant preview"
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
            Assistant personalization
          </h1>
          <p className="text-sm text-muted-foreground">
            Adjust the tone, voice, and avatar of your financial assistant.
          </p>
        </div>
      </section>

      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={SETTINGS_STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="min-h-[500px]"
        >
          {activeTab === TAB_ID.TONE && (
            <AssistantSettingsTreatmentStyle
              value={currentProfile.treatmentStyle}
              onChange={(next: TreatmentStyle) =>
                patch({ treatmentStyle: next })
              }
              disabled={mutationPending}
            />
          )}

          {activeTab === TAB_ID.VOICE && (
            <AssistantSettingsVoice
              voices={voices.data ?? []}
              selectedVoiceId={currentProfile.voiceId}
              onSelect={(voiceId) => patch({ voiceId })}
              onPreview={(voiceId) => previewVoice.mutateAsync(voiceId)}
              disabled={mutationPending}
            />
          )}

          {activeTab === TAB_ID.AVATAR && (
            <AssistantSettingsAvatar
              avatarUrl={currentProfile.avatarUrl}
              defaultSeed={defaultSeed}
              onChange={(avatarUrl) => patch({ avatarUrl })}
              disabled={mutationPending}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default AssistantSettingsScreen;
