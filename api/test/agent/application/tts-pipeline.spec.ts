import { TtsPipeline } from '~/agent/application/tts-pipeline';
import type {
  SynthesizeStreamParams,
  TtsClient,
} from '~/agent/domain/ports/tts-client';

interface Listeners {
  onAudio: jest.Mock;
  onDone: jest.Mock;
  onCanceled: jest.Mock;
  onError: jest.Mock;
}

const makeListeners = (): Listeners => ({
  onAudio: jest.fn(),
  onDone: jest.fn(),
  onCanceled: jest.fn(),
  onError: jest.fn(),
});

interface StreamHandle {
  yield(chunk: Buffer): void;
  end(): void;
  fail(err: Error): void;
  waitForSignal(): AbortSignal | undefined;
}

const makeControllableTts = (): {
  tts: TtsClient;
  handles: StreamHandle[];
} => {
  const handles: StreamHandle[] = [];
  const tts: TtsClient = {
    async *synthesizeStream(params: SynthesizeStreamParams) {
      const queue: Array<Buffer | 'end' | Error> = [];
      let resolvePending: (() => void) | null = null;
      const push = (item: Buffer | 'end' | Error): void => {
        queue.push(item);
        if (resolvePending) {
          const r = resolvePending;
          resolvePending = null;
          r();
        }
      };
      const handle: StreamHandle = {
        yield: (chunk) => push(chunk),
        end: () => push('end'),
        fail: (err) => push(err),
        waitForSignal: () => params.signal,
      };
      handles.push(handle);

      for (;;) {
        while (queue.length === 0) {
          await new Promise<void>((resolve) => {
            resolvePending = resolve;
          });
        }
        const item = queue.shift();
        if (item === 'end') return;
        if (item instanceof Error) throw item;
        if (params.signal?.aborted) return;
        yield item as Buffer;
      }
    },
    listVoices: jest.fn(),
  };
  return { tts, handles };
};

describe('TtsPipeline', () => {
  it('feeds audio chunks to onAudio and calls onDone when the stream completes', async () => {
    const { tts, handles } = makeControllableTts();
    const listeners = makeListeners();
    const pipeline = new TtsPipeline(tts, listeners);

    const done = pipeline.speak({ text: 'olá', voiceId: 'v1' });
    await Promise.resolve();
    const h = handles[0];
    h.yield(Buffer.from([1, 2, 3]));
    h.yield(Buffer.from([4, 5]));
    h.end();
    await done;

    expect(listeners.onAudio).toHaveBeenCalledTimes(2);
    expect(listeners.onDone).toHaveBeenCalledTimes(1);
    expect(listeners.onError).not.toHaveBeenCalled();
    expect(listeners.onCanceled).not.toHaveBeenCalled();
  });

  it('cancel() aborts the current stream and fires onCanceled exactly once', async () => {
    const { tts, handles } = makeControllableTts();
    const listeners = makeListeners();
    const pipeline = new TtsPipeline(tts, listeners);

    const done = pipeline.speak({ text: 'x', voiceId: 'v1' });
    await Promise.resolve();
    handles[0].yield(Buffer.from([1]));
    pipeline.cancel();
    handles[0].end();
    await done;

    expect(listeners.onCanceled).toHaveBeenCalledTimes(1);
    expect(listeners.onDone).not.toHaveBeenCalled();
    expect(handles[0].waitForSignal()?.aborted).toBe(true);
  });

  it('cancel() is a no-op when there is nothing in flight', () => {
    const { tts } = makeControllableTts();
    const listeners = makeListeners();
    const pipeline = new TtsPipeline(tts, listeners);

    pipeline.cancel();

    expect(listeners.onCanceled).not.toHaveBeenCalled();
  });

  it('a subsequent speak() supersedes the previous one — old is canceled, new starts', async () => {
    const { tts, handles } = makeControllableTts();
    const listeners = makeListeners();
    const pipeline = new TtsPipeline(tts, listeners);

    const first = pipeline.speak({ text: 'first', voiceId: 'v1' });
    await Promise.resolve();
    handles[0].yield(Buffer.from([1]));

    const second = pipeline.speak({ text: 'second', voiceId: 'v1' });
    await Promise.resolve();
    handles[1].yield(Buffer.from([9]));
    handles[1].end();
    handles[0].end();
    await first;
    await second;

    expect(listeners.onCanceled).toHaveBeenCalledTimes(1);
    expect(handles).toHaveLength(2);
    expect(handles[0].waitForSignal()?.aborted).toBe(true);
    expect(listeners.onDone).toHaveBeenCalledTimes(1);
    expect(listeners.onAudio).toHaveBeenCalledWith(Buffer.from([9]));
  });

  it('errors from the stream are reported via onError, not onDone', async () => {
    const { tts, handles } = makeControllableTts();
    const listeners = makeListeners();
    const pipeline = new TtsPipeline(tts, listeners);

    const done = pipeline.speak({ text: 'x', voiceId: 'v1' });
    await Promise.resolve();
    handles[0].fail(new Error('boom'));
    await done;

    expect(listeners.onError).toHaveBeenCalledTimes(1);
    const errorArg = (listeners.onError.mock.calls as [Error][])[0][0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(listeners.onDone).not.toHaveBeenCalled();
  });

  it('does not fire onError when the stream failure follows a cancel', async () => {
    const { tts, handles } = makeControllableTts();
    const listeners = makeListeners();
    const pipeline = new TtsPipeline(tts, listeners);

    const done = pipeline.speak({ text: 'x', voiceId: 'v1' });
    await Promise.resolve();
    pipeline.cancel();
    handles[0].fail(new Error('aborted'));
    await done;

    expect(listeners.onCanceled).toHaveBeenCalledTimes(1);
    expect(listeners.onError).not.toHaveBeenCalled();
  });
});
