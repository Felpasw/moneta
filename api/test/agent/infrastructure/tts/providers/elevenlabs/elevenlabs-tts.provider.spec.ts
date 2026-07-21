import { ElevenLabsTtsProvider } from '~/agent/infrastructure/tts/providers/elevenlabs/elevenlabs-tts.provider';

describe('ElevenLabsTtsProvider', () => {
  const provider = new ElevenLabsTtsProvider();

  describe('buildStreamRequest', () => {
    it('returns the ElevenLabs streaming URL for the voiceId, the xi-api-key header, and body with text + model_id', () => {
      const req = provider.buildStreamRequest({
        text: 'olá',
        voiceId: 'voice-1',
      });

      expect(req.url).toBe(
        'https://api.elevenlabs.io/v1/text-to-speech/voice-1/stream',
      );
      expect(req.headers['xi-api-key']).toBeDefined();
      expect(req.headers['xi-api-key'].length).toBeGreaterThan(0);
      expect(req.headers.accept).toBe('audio/mpeg');
      expect(req.body).toMatchObject({
        text: 'olá',
        model_id: 'eleven_multilingual_v2',
      });
    });
  });

  describe('buildListVoicesRequest', () => {
    it('returns the ElevenLabs voices URL and xi-api-key header', () => {
      const req = provider.buildListVoicesRequest();

      expect(req.url).toBe('https://api.elevenlabs.io/v1/voices');
      expect(req.headers['xi-api-key']).toBeDefined();
      expect(req.headers['xi-api-key'].length).toBeGreaterThan(0);
    });
  });

  describe('parseVoicesResponse', () => {
    it('normalizes { voice_id, name, labels.language } to domain shape', () => {
      const raw = {
        voices: [
          {
            voice_id: 'v1',
            name: 'Rachel',
            labels: { language: 'en', gender: 'female' },
          },
          { voice_id: 'v2', name: 'Carlos', labels: { language: 'pt' } },
          { voice_id: 'v3', name: 'NoLabels' },
        ],
      };

      expect(provider.parseVoicesResponse(raw)).toEqual([
        { voiceId: 'v1', name: 'Rachel', language: 'en' },
        { voiceId: 'v2', name: 'Carlos', language: 'pt' },
        { voiceId: 'v3', name: 'NoLabels' },
      ]);
    });

    it('returns an empty array when the envelope has no voices key', () => {
      expect(provider.parseVoicesResponse({})).toEqual([]);
    });
  });
});
