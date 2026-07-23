export const REALTIME_EVENT_TYPE = {
  responseTextDone: 'response.output_text.done',
  inputAudioBufferSpeechStarted: 'input_audio_buffer.speech_started',
  sessionUpdate: 'session.update',
  responseCreate: 'response.create',
  responseFunctionCallArgumentsDone: 'response.function_call_arguments.done',
  conversationItemCreate: 'conversation.item.create',
} as const;
