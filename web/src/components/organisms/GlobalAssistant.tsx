"use client";

import { Info, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AgentActionIndicator } from "@/components/atoms/AgentActionIndicator";
import { BarLoader } from "@/components/atoms/BarLoader";
import { MicButton } from "@/components/atoms/MicButton";
import { ShinyButton } from "@/components/atoms/ShinyButton";
import { TalkingAssistantAvatar } from "@/components/atoms/TalkingAssistantAvatar";
import { AssistantCapabilitiesPopover } from "@/components/organisms/AssistantCapabilitiesPopover";
import { GlobalAssistantSlideSlot } from "@/components/organisms/GlobalAssistantSlideSlot";
import {
  FALLBACK_SEED,
  HIDDEN_ROUTES,
  HOVER_LIFT,
  HOVER_TRANSITION,
  MESSAGE_SOON_TOAST,
  TAP_PRESS,
} from "@/components/organisms/globalAssistant.constants";
import assistantProfileHooks from "@/hooks/useAssistantProfile";
import { useClickOutside } from "@/hooks/useClickOutside";
import { agentSessionActions, useAgentSessionStore } from "@/stores/agentSessionStore";
import { useUserStore } from "@/stores/userStore";

export function GlobalAssistant() {
  const pathname = usePathname();
  const audioElement = useAgentSessionStore((s) => s.audioElement);
  const isWarming = useAgentSessionStore((s) => s.isWarming);
  const micState = useAgentSessionStore((s) => s.micState);
  const interruptionPulse = useAgentSessionStore((s) => s.interruptionPulse);
  const { profile } = assistantProfileHooks.use();
  const user = useUserStore((s) => s.user);

  const [expanded, setExpanded] = useState(false);
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside({
    ref: containerRef,
    enabled: expanded,
    onOutside: () => setExpanded(false),
  });

  if (pathname !== null && HIDDEN_ROUTES.has(pathname)) return null;

  const fallbackSeed = user?.name ?? FALLBACK_SEED;

  const handleMessageClick = (): void => {
    toast(MESSAGE_SOON_TOAST);
  };

  const handleInfoClick = (): void => {
    setCapabilitiesOpen((prev) => !prev);
  };

  return (
    <motion.aside
      aria-label="Moneta assistant"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-36 left-1/2 z-40 -translate-x-1/2"
    >
      <div ref={containerRef} className="flex items-center gap-3">
        <motion.button
          type="button"
          aria-label={expanded ? "Close assistant options" : "Open assistant options"}
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          whileHover={HOVER_LIFT}
          whileTap={TAP_PRESS}
          transition={HOVER_TRANSITION}
          className="relative flex shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div
            aria-hidden
            className="absolute -inset-2 rounded-full bg-primary/30 blur-xl"
          />
          <TalkingAssistantAvatar
            avatarUrl={profile.data?.avatarUrl ?? null}
            audioElement={audioElement}
            fallbackSeed={fallbackSeed}
            size="md"
            sensitivity={6}
            interruptSignal={interruptionPulse}
            className="relative h-14 w-14"
          />
          <AgentActionIndicator outputLanguage={profile.data.outputLanguage} />
        </motion.button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <GlobalAssistantSlideSlot key="mic">
              {isWarming ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                  <BarLoader barHeight={22} barWidth={2.5} bars={4} />
                </div>
              ) : (
                <MicButton
                  state={micState}
                  onToggle={agentSessionActions.toggleMic}
                  className="shrink-0"
                />
              )}
            </GlobalAssistantSlideSlot>
          ) : null}

          {expanded ? (
            <GlobalAssistantSlideSlot key="msg" delay={0.08}>
              <ShinyButton
                ariaLabel="Messages (coming soon)"
                onClick={handleMessageClick}
                variant="default"
                className="p-2"
                icon={<MessageCircle aria-hidden className="h-6 w-6 text-white/90" />}
              />
            </GlobalAssistantSlideSlot>
          ) : null}

          {expanded ? (
            <GlobalAssistantSlideSlot key="info" delay={0.16}>
              <ShinyButton
                ariaLabel="What the assistant can do"
                onClick={handleInfoClick}
                onMouseDown={(e) => e.stopPropagation()}
                variant="indigo"
                className="p-2"
                icon={<Info aria-hidden className="h-6 w-6 text-indigo-300" />}
              />
            </GlobalAssistantSlideSlot>
          ) : null}
        </AnimatePresence>
      </div>

      <AssistantCapabilitiesPopover
        open={capabilitiesOpen}
        onOpenChange={setCapabilitiesOpen}
      />
    </motion.aside>
  );
}

export default GlobalAssistant;
