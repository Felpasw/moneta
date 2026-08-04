"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface UseAudioAmplitudeOptions {
  readonly sensitivity: number;
  readonly speakingThreshold: number;
}

interface UseAudioAmplitudeResult {
  readonly scale: MotionValue<number>;
  readonly bob: MotionValue<number>;
  readonly isSpeaking: boolean;
}

const SILENCE_HOLD_FRAMES = 8;
const SCALE_GAIN = 0.06;
const BOB_GAIN = 4;

const resolveAudioContextCtor = (): typeof AudioContext | null => {
  if (typeof window === "undefined") return null;
  const win = window as WebkitAudioWindow;
  return window.AudioContext ?? win.webkitAudioContext ?? null;
};

export function useAudioAmplitude(
  audioElement: HTMLAudioElement | null,
  options: UseAudioAmplitudeOptions,
): UseAudioAmplitudeResult {
  const { sensitivity, speakingThreshold } = options;
  const scale = useMotionValue(1);
  const bob = useMotionValue(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!audioElement) {
      scale.set(1);
      bob.set(0);
      setIsSpeaking(false);
      return undefined;
    }

    const Ctor = resolveAudioContextCtor();
    if (!Ctor) return undefined;

    const ctx = new Ctor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;

    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(audioElement);
    } catch {
      void ctx.close().catch(() => undefined);
      return undefined;
    }
    source.connect(analyser);
    source.connect(ctx.destination);
    void ctx.resume().catch(() => undefined);

    const bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    let raf = 0;
    let silentFrames = 0;

    const step = () => {
      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = 0; i < bins.length; i++) {
        const value = bins[i] / 255;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / bins.length);
      const amp = Math.min(rms * sensitivity, 1);

      scale.set(1 + amp * SCALE_GAIN);
      bob.set(-amp * BOB_GAIN);

      if (amp > speakingThreshold) {
        silentFrames = 0;
        setIsSpeaking((prev) => (prev ? prev : true));
      } else if (silentFrames >= SILENCE_HOLD_FRAMES) {
        setIsSpeaking((prev) => (prev ? false : prev));
      } else {
        silentFrames += 1;
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      analyser.disconnect();
      void ctx.close().catch(() => undefined);
      scale.set(1);
      bob.set(0);
      setIsSpeaking(false);
    };
  }, [audioElement, sensitivity, speakingThreshold, scale, bob]);

  return { scale, bob, isSpeaking };
}
