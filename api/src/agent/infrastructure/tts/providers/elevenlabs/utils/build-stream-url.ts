export const buildStreamUrl = (voiceId: string): string =>
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
