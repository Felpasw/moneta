import type { TtsVoice } from '~/agent/domain/ports/tts-service';
import type { VoiceLanguageMatch } from '~/agent/domain/utils/resolve-language-match';

export interface TtsVoiceWithMatch extends TtsVoice {
  readonly languageMatch: VoiceLanguageMatch;
}
