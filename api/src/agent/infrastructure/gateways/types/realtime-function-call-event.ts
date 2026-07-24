export interface RealtimeFunctionCallEvent {
  readonly type: string;
  readonly name: string;
  readonly call_id: string;
  readonly arguments: string;
}
