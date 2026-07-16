import { parseRealtimeEvent } from '~/agent/infrastructure/gateways/utils/parse-realtime-event';

describe('parseRealtimeEvent', () => {
  it('parses a valid JSON frame with a string type', () => {
    const raw = Buffer.from(
      JSON.stringify({ type: 'response.text.done', text: 'oi' }),
    );

    const parsed = parseRealtimeEvent(raw);

    expect(parsed).toEqual({ type: 'response.text.done', text: 'oi' });
  });

  it('accepts a string payload directly', () => {
    const parsed = parseRealtimeEvent(
      JSON.stringify({ type: 'input_audio_buffer.speech_started' }),
    );

    expect(parsed?.type).toBe('input_audio_buffer.speech_started');
  });

  it('returns null for invalid JSON', () => {
    expect(parseRealtimeEvent(Buffer.from('not-json'))).toBeNull();
  });

  it('returns null when the parsed payload has no string "type" field', () => {
    expect(
      parseRealtimeEvent(Buffer.from(JSON.stringify({ foo: 1 }))),
    ).toBeNull();
    expect(
      parseRealtimeEvent(Buffer.from(JSON.stringify({ type: 42 }))),
    ).toBeNull();
    expect(parseRealtimeEvent(Buffer.from(JSON.stringify(null)))).toBeNull();
    expect(parseRealtimeEvent(Buffer.from(JSON.stringify([1, 2])))).toBeNull();
  });
});
