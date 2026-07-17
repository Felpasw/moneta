export class ToolTimeoutError extends Error {
  constructor() {
    super('Tool execution timed out');
    this.name = 'ToolTimeoutError';
  }
}
