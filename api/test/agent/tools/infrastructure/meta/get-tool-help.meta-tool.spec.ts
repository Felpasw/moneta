import { DiscoveryModule } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '~/agent/tools/domain/assistant-tool';
import { MetaToolName } from '~/agent/tools/domain/constants/meta-tool-name';
import { ToolHelpErrorCode } from '~/agent/tools/domain/constants/tool-help-error-code';
import { RegisterAssistantTool } from '~/agent/tools/infrastructure/register-assistant-tool.decorator';
import { ToolRegistry } from '~/agent/tools/infrastructure/tool-registry';

const ctx: AssistantContext = { userId: 'u', requestId: 'r' };

@RegisterAssistantTool()
class BalanceTool implements AssistantTool {
  readonly name = 'get_balance';
  readonly description = 'Returns balance';
  readonly jsonSchema = { type: 'object', properties: {} };
  readonly playbook = 'Playbook do balance com regras específicas.';
  execute(): Promise<AssistantToolResult> {
    return Promise.resolve({ ok: true, data: 100 });
  }
}

const buildRegistry = async (
  providers: unknown[] = [BalanceTool],
): Promise<ToolRegistry> => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [DiscoveryModule],
    providers: [ToolRegistry, ...(providers as never[])],
  }).compile();
  await module.init();
  return module.get(ToolRegistry);
};

describe('get_tool_help meta-tool', () => {
  it('is auto-registered under the reserved meta name', async () => {
    const registry = await buildRegistry();
    const meta = registry.getByName(MetaToolName.GetToolHelp);
    expect(meta).not.toBeNull();
    expect(meta?.playbook.length).toBeGreaterThan(0);
    expect(meta?.description.length).toBeGreaterThan(0);
  });

  it('appears in the realtime tools list alongside user-registered tools', async () => {
    const registry = await buildRegistry();
    const names = registry
      .toRealtimeToolsList()
      .map((t) => t.name)
      .sort();
    expect(names).toEqual(['get_balance', MetaToolName.GetToolHelp].sort());
  });

  it('registry.getToolHelp returns entry for known tool', async () => {
    const registry = await buildRegistry();
    expect(registry.getToolHelp('get_balance')).toEqual({
      found: true,
      entry: {
        name: 'get_balance',
        description: 'Returns balance',
        playbook: 'Playbook do balance com regras específicas.',
      },
    });
  });

  it('registry.getToolHelp returns structured tool_not_found for unknown tool', async () => {
    const registry = await buildRegistry();
    expect(registry.getToolHelp('ghost')).toEqual({
      found: false,
      error: {
        error: ToolHelpErrorCode.ToolNotFound,
        toolName: 'ghost',
      },
    });
  });

  it('registry.getToolHelp can look up the meta-tool itself', async () => {
    const registry = await buildRegistry();
    const result = registry.getToolHelp(MetaToolName.GetToolHelp);
    expect(result.found).toBe(true);
    expect(result.entry?.name).toBe(MetaToolName.GetToolHelp);
  });

  it('meta-tool.execute returns AssistantToolResult wrapping the entry — success', async () => {
    const registry = await buildRegistry();
    const meta = registry.getByName(MetaToolName.GetToolHelp);
    const result = await meta?.execute({ toolName: 'get_balance' }, ctx);
    expect(result).toEqual({
      ok: true,
      data: {
        name: 'get_balance',
        description: 'Returns balance',
        playbook: 'Playbook do balance com regras específicas.',
      },
    });
  });

  it('meta-tool.execute returns AssistantToolResult wrapping the error — not found', async () => {
    const registry = await buildRegistry();
    const meta = registry.getByName(MetaToolName.GetToolHelp);
    const result = await meta?.execute({ toolName: 'ghost' }, ctx);
    expect(result).toEqual({
      ok: true,
      data: {
        error: ToolHelpErrorCode.ToolNotFound,
        toolName: 'ghost',
      },
    });
  });

  it('rejects a user tool that tries to reuse the reserved meta-tool name', async () => {
    @RegisterAssistantTool()
    class ClashTool implements AssistantTool {
      readonly name = MetaToolName.GetToolHelp;
      readonly description = 'nope';
      readonly jsonSchema = {};
      readonly playbook = 'p';
      execute(): Promise<AssistantToolResult> {
        return Promise.resolve({ ok: true });
      }
    }

    await expect(buildRegistry([ClashTool])).rejects.toThrow(/reserved/i);
  });
});
