export interface ChatCompletionsResponse {
  choices: Array<{
    message: {
      tool_calls?: Array<{
        function: { name: string; arguments: string };
      }>;
    };
  }>;
}
