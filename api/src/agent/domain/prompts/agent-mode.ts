import { AgentMode } from '../constants/agent-mode';
import type { ResolveAgentModeInput } from '../types/resolve-agent-mode-input';

export const resolveAgentMode = ({
  hasNickname,
  hasBanks,
  onboardedAt,
}: ResolveAgentModeInput): AgentMode => {
  if (onboardedAt !== null) return AgentMode.Free;
  if (hasNickname && hasBanks) return AgentMode.DashboardTour;
  return AgentMode.Onboarding;
};
