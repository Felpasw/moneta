export const GET_TOOL_HELP = {
  description:
    'Retrieves the detailed playbook of a specific tool. Call before invoking a tool for the first time in a session to load its rules.',
  jsonSchema: {
    type: 'object',
    properties: {
      toolName: {
        type: 'string',
        description: 'Name of the tool whose playbook should be retrieved.',
      },
    },
    required: ['toolName'],
    additionalProperties: false,
  } as Record<string, unknown>,
  playbook:
    'Use get_tool_help({ toolName }) para carregar o playbook completo de uma tool antes de invocá-la pela primeira vez em uma sessão. O resultado já contém todas as regras específicas — cache em memória e não rechame para a mesma tool na mesma sessão.',
};
