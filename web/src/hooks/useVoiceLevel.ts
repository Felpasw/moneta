"use client";

import { useCallback, useEffect, useRef } from "react";

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface UseVoiceLevelOptions {
  readonly audioElement: HTMLAudioElement | null;
  readonly sensitivity: number;
}

interface UseVoiceLevelResult {
  readonly getLevel: () => number | null;
}

const AMPLITUDE_GAIN = 3.0;

const resolveAudioContextCtor = (): typeof AudioContext | null => {
  if (typeof window === "undefined") return null;
  const win = window as WebkitAudioWindow;
  return window.AudioContext ?? win.webkitAudioContext ?? null;
};

export function useVoiceLevel({
  audioElement,
  sensitivity,
}: UseVoiceLevelOptions): UseVoiceLevelResult {
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    const teardown = () => {
      if (sourceRef.current !== null) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (analyserRef.current !== null) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (contextRef.current !== null && contextRef.current.state !== "closed") {
        contextRef.current.close().catch(() => undefined);
      }
      contextRef.current = null;
      dataArrayRef.current = null;
    };

    if (audioElement === null) {
      return teardown;
    }

    const Ctor = resolveAudioContextCtor();
    if (Ctor === null) return teardown;

    const attach = async () => {
      const ctx = new Ctor();
      contextRef.current = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyser);
      source.connect(ctx.destination);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(
        new ArrayBuffer(analyser.frequencyBinCount),
      );
    };

    attach().catch(() => teardown());

    return teardown;
  }, [audioElement]);

  const getLevel = useCallback((): number | null => {
    const analyser = analyserRef.current;
    const bins = dataArrayRef.current;
    if (analyser === null || bins === null) return null;

    analyser.getByteFrequencyData(bins);
    let sum = 0;
    for (let i = 0; i < bins.length; i++) {
      const value = bins[i] / 255;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / bins.length);
    return Math.min(rms * sensitivityRef.current * AMPLITUDE_GAIN, 1);
  }, []);

  return { getLevel };
}
