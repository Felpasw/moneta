/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `assistantProfileHooks.use()` acontece
 * durante o render em ordem estável, então Rules of Hooks (runtime) segue
 * respeitada. Regra: `use()` chama todos os hooks no topo em ordem fixa, sem
 * `if`/loop.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import assistantProfileService from "@/services/assistantProfile.service";
import type {
  AssistantProfile,
  TtsVoice,
  UpdateProfilePatch,
} from "@/services/interfaces/assistantProfile.interface";

import type {
  AssistantProfileHooksResult,
  IAssistantProfileHooks,
} from "./interfaces/useAssistantProfile.interface";

export const ASSISTANT_PROFILE_QUERY_KEYS = {
  all: ["agent"] as const,
  profile: ["agent", "profile"] as const,
  voices: ["agent", "voices"] as const,
};

const VOICES_STALE_TIME_MS = 10 * 60 * 1000;

class AssistantProfileHooks implements IAssistantProfileHooks {
  use(): AssistantProfileHooksResult {
    const queryClient = useQueryClient();

    const profile = useQuery<AssistantProfile>({
      queryKey: ASSISTANT_PROFILE_QUERY_KEYS.profile,
      queryFn: () => assistantProfileService.getProfile(),
    });

    const voices = useQuery<TtsVoice[]>({
      queryKey: ASSISTANT_PROFILE_QUERY_KEYS.voices,
      queryFn: () => assistantProfileService.listVoices(),
      staleTime: VOICES_STALE_TIME_MS,
    });

    const previewVoice = useMutation<Blob, unknown, string>({
      mutationFn: (voiceId) => assistantProfileService.previewVoice(voiceId),
    });

    const updateProfile = useMutation<
      AssistantProfile,
      unknown,
      UpdateProfilePatch
    >({
      mutationFn: (patch) => assistantProfileService.updateProfile(patch),
      onSuccess: (data) => {
        queryClient.setQueryData(ASSISTANT_PROFILE_QUERY_KEYS.profile, data);
      },
    });

    return { profile, voices, previewVoice, updateProfile };
  }
}

const assistantProfileHooks = new AssistantProfileHooks();

export default assistantProfileHooks;
