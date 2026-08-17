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
  StateInvalidate = "state.invalidate",
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
  AccountsFetching = "accounts.fetching",
  BanksFetching = "banks.fetching",
  CurrentInvoiceFetching = "current_invoice.fetching",
  InvoicesFetching = "invoices.fetching",
  CategoriesFetching = "categories.fetching",
  TransactionsFetching = "transactions.fetching",
  TransfersFetching = "transfers.fetching",
  BankAccountAdding = "bank_account.adding",
  BankAccountUpdating = "bank_account.updating",
  BankAccountDeleting = "bank_account.deleting",
  BalanceSetting = "balance.setting",
  AccountBalancesSetting = "account_balances.setting",
  CategoryAdding = "category.adding",
  CategoryUpdating = "category.updating",
  CategoryDeleting = "category.deleting",
  TransactionEditing = "transaction.editing",
  TransactionsEditing = "transactions.editing",
  TransactionDeleting = "transaction.deleting",
  TransferDeleting = "transfer.deleting",
  NicknameSetting = "nickname.setting",
  UserBanksAdding = "user_banks.adding",
  AccountDetailsConfiguring = "account_details.configuring",
  SetupFinishing = "setup.finishing",
  OnboardingCompleting = "onboarding.completing",
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
