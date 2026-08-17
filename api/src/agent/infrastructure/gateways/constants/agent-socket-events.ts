export enum AgentSocketEvent {
  ToolPending = 'tool.pending',
  ToolResult = 'tool.result',
  ToolError = 'tool.error',
  SystemRedirect = 'system.redirect',
  TtsAudioDelta = 'tts.audio.delta',
  TtsAudioDone = 'tts.audio.done',
  TtsAudioCanceled = 'tts.audio.canceled',
  TtsAudioError = 'tts.audio.error',
}
