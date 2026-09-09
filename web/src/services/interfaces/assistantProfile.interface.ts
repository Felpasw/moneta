export type TreatmentStyle = "formal" | "informal" | "very_informal";

export type OutputLanguage = "pt_BR" | "en_US";

export interface AssistantProfile {
  treatmentStyle: TreatmentStyle;
  outputLanguage: OutputLanguage;
  voiceId: string;
  avatarUrl: string | null;
}

export type NormalizedVoiceLanguage = "pt_BR" | "en_US" | "unknown";
export type VoiceLanguageMatch = "match" | "mismatch" | "unknown";

export interface TtsVoice {
  voiceId: string;
  name: string;
  language: NormalizedVoiceLanguage;
  languageMatch: VoiceLanguageMatch;
}

export interface ListVoicesResponse {
  voices: TtsVoice[];
}

export interface UpdateProfilePatch {
  treatmentStyle?: TreatmentStyle;
  outputLanguage?: OutputLanguage;
  voiceId?: string;
  avatarUrl?: string | null;
}

export interface IAssistantProfileService {
  getProfile(): Promise<AssistantProfile>;
  listVoices(): Promise<TtsVoice[]>;
  previewVoice(voiceId: string): Promise<Blob>;
  updateProfile(patch: UpdateProfilePatch): Promise<AssistantProfile>;
}
