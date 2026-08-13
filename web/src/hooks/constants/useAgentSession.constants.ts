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

export enum AgentSocketEvent {
  ToolPending = "tool.pending",
  ToolResult = "tool.result",
  ToolError = "tool.error",
  SystemRedirect = "system.redirect",
  TtsAudioDelta = "tts.audio.delta",
  TtsAudioDone = "tts.audio.done",
  TtsAudioCanceled = "tts.audio.canceled",
  TtsAudioError = "tts.audio.error",
}

export enum ToolCaptionKey {
  InstallmentPurchaseRegistering = "installment_purchase.registering",
  TransactionRegistering = "transaction.registering",
  TransactionsRegistering = "transactions.registering",
  CreditPurchaseRegistering = "credit_purchase.registering",
  CreditPurchasesRegistering = "credit_purchases.registering",
  TransferRegistering = "transfer.registering",
  InvoicePaying = "invoice.paying",
  InvoiceMarkingPaid = "invoice.marking_paid",
  InstallmentPurchaseCanceling = "installment_purchase.canceling",
}

export enum ToolEventKind {
  Pending = "pending",
  Result = "result",
  Error = "error",
}

export const REALTIME_INPUT_AUDIO_APPEND = "input_audio_buffer.append";
export const REALTIME_TARGET_SAMPLE_RATE = 24000;
export const MIC_PROCESSOR_BUFFER_SIZE = 4096;
export const TTS_AUDIO_MIME = "audio/mpeg";
