import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  AssistantProfile,
  TtsVoice,
  UpdateProfilePatch,
} from "@/services/interfaces/assistantProfile.interface";

export interface AssistantProfileHooksResult {
  profile: UseQueryResult<AssistantProfile>;
  voices: UseQueryResult<TtsVoice[]>;
  previewVoice: UseMutationResult<Blob, unknown, string>;
  updateProfile: UseMutationResult<AssistantProfile, unknown, UpdateProfilePatch>;
}

export interface IAssistantProfileHooks {
  use(): AssistantProfileHooksResult;
}
