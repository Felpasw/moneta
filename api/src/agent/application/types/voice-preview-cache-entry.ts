export interface VoicePreviewCacheEntry {
  readonly audio: Buffer;
  readonly expiresAt: number;
}
