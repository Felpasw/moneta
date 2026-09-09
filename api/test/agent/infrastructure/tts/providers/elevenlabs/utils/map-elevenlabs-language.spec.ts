import { mapElevenLabsLanguage } from '~/agent/infrastructure/tts/providers/elevenlabs/utils/map-elevenlabs-language';

describe('mapElevenLabsLanguage', () => {
  describe('portuguese variants', () => {
    it.each([
      'pt',
      'pt-br',
      'pt_BR',
      'PT',
      'PT-BR',
      'Portuguese',
      'portuguese',
    ])('maps %s to pt_BR', (raw) => {
      expect(mapElevenLabsLanguage(raw)).toBe('pt_BR');
    });
  });

  describe('english variants', () => {
    it.each(['en', 'en-us', 'en_US', 'EN', 'EN-US', 'English', 'english'])(
      'maps %s to en_US',
      (raw) => {
        expect(mapElevenLabsLanguage(raw)).toBe('en_US');
      },
    );
  });

  describe('unknown / unsupported', () => {
    it.each([
      undefined,
      '',
      '   ',
      'fr',
      'de',
      'es',
      'ja',
      'zz',
      'random-lixo',
    ])('maps %s to unknown', (raw) => {
      expect(mapElevenLabsLanguage(raw)).toBe('unknown');
    });
  });
});
