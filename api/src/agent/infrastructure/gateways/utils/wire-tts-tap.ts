import { Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';

import { TtsPipeline } from '~/agent/application/tts-pipeline';
import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import type { TtsService } from '~/agent/domain/ports/tts-service';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';
import { TTS_EVENT_TYPE } from '../constants/tts-event-types';
import { parseRealtimeEvent } from './parse-realtime-event';
import { sendClientEvent } from './send-client-event';

interface TtsTapContext {
  readonly client: WebSocket;
  readonly upstream: RealtimeUpstream;
  readonly tts: TtsService;
  readonly voiceId: string;
}

const debugLogger = new Logger('UpstreamDebug');

export const wireTtsTap = (ctx: TtsTapContext): void => {
  const pipeline = new TtsPipeline(ctx.tts, {
    onAudio: (chunk) => {
      sendClientEvent(ctx.client, {
        type: TTS_EVENT_TYPE.audioDelta,
        audio: chunk.toString('base64'),
      });
    },
    onDone: () => {
      sendClientEvent(ctx.client, { type: TTS_EVENT_TYPE.audioDone });
    },
    onCanceled: () => {
      sendClientEvent(ctx.client, { type: TTS_EVENT_TYPE.audioCanceled });
    },
    onError: (err) => {
      sendClientEvent(ctx.client, {
        type: TTS_EVENT_TYPE.audioError,
        message: err.message,
      });
    },
  });

  ctx.upstream.onMessage((data) => {
    const event = parseRealtimeEvent(data);
    if (!event) return;
    if (event.type === 'error') {
      debugLogger.error(`upstream error payload: ${JSON.stringify(event)}`);
    } else {
      debugLogger.log(`upstream event: ${event.type}`);
    }
    if (
      event.type === REALTIME_EVENT_TYPE.responseTextDone &&
      typeof event.text === 'string' &&
      event.text.length > 0
    ) {
      void pipeline.speak({ text: event.text, voiceId: ctx.voiceId });
      return;
    }
    if (event.type === REALTIME_EVENT_TYPE.inputAudioBufferSpeechStarted) {
      pipeline.cancel();
    }
  });
};
