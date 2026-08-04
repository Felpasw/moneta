export type TreatmentStyle = "formal" | "informal" | "very_informal";

export interface AssistantProfile {
  treatmentStyle: TreatmentStyle;
  voiceId: string;
  avatarUrl: string | null;
}

export interface TtsVoice {
  voiceId: string;
  name: string;
  language?: string;
}

export interface ListVoicesResponse {
  voices: TtsVoice[];
}

export interface UpdateProfilePatch {
  treatmentStyle?: TreatmentStyle;
  voiceId?: string;
  avatarUrl?: string | null;
}

export interface IAssistantProfileService {
  getProfile(): Promise<AssistantProfile>;
  listVoices(): Promise<TtsVoice[]>;
  previewVoice(voiceId: string): Promise<Blob>;
  updateProfile(patch: UpdateProfilePatch): Promise<AssistantProfile>;
}
