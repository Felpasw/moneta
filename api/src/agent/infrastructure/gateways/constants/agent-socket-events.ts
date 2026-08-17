export enum AgentSocketEvent {
  ToolPending = 'tool.pending',
  ToolResult = 'tool.result',
  ToolError = 'tool.error',
  SystemRedirect = 'system.redirect',
  StateInvalidate = 'state.invalidate',
  TtsAudioDelta = 'tts.audio.delta',
  TtsAudioDone = 'tts.audio.done',
  TtsAudioCanceled = 'tts.audio.canceled',
  TtsAudioError = 'tts.audio.error',
}
