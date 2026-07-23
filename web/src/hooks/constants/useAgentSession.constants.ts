export enum AgentSessionStatus {
  Idle = "idle",
  Connecting = "connecting",
  Listening = "listening",
  Speaking = "speaking",
  Error = "error",
}

export enum MicState {
  Off = "off",
  Requesting = "requesting",
  Live = "live",
  Denied = "denied",
  Error = "error",
}

export const TTS_EVENT = {
  delta: "tts.audio.delta",
  done: "tts.audio.done",
  canceled: "tts.audio.canceled",
  error: "tts.audio.error",
} as const;

export const REALTIME_INPUT_AUDIO_APPEND = "input_audio_buffer.append";
export const REALTIME_TARGET_SAMPLE_RATE = 24000;
export const MIC_PROCESSOR_BUFFER_SIZE = 4096;
export const TTS_AUDIO_MIME = "audio/mpeg";
