import { DiscoveryModule } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

import type {
  AssistantTool,
  AssistantToolResult,
} from '~/agent/tools/domain/assistant-tool';
import { MetaToolName } from '~/agent/tools/domain/constants/meta-tool-name';
import { RegisterAssistantTool } from '~/agent/tools/infrastructure/register-assistant-tool.decorator';
import { ToolRegistry } from '~/agent/tools/infrastructure/tool-registry';

const RESERVED_META_NAMES: readonly string[] = Object.values(MetaToolName);
const userNames = (registry: ToolRegistry): string[] =>
  registry
    .getAll()
    .map((t) => t.name)
    .filter((n) => !RESERVED_META_NAMES.includes(n))
    .sort();

const makeExecute = () =>
  jest.fn((): Promise<AssistantToolResult> => Promise.resolve({ ok: true }));

@RegisterAssistantTool()
class BalanceTool implements AssistantTool {
  readonly name = 'get_balance';
  readonly description = 'Returns current balance';
  readonly jsonSchema = { type: 'object', properties: {} };
  readonly playbook = 'Use to fetch account balance.';
  execute = makeExecute();
}

@RegisterAssistantTool()
class TransferTool implements AssistantTool {
  readonly name = 'transfer';
  readonly description = 'Transfers money';
  readonly jsonSchema = {
    type: 'object',
    properties: { to: { type: 'string' }, amount: { type: 'number' } },
    required: ['to', 'amount'],
  };
  readonly playbook = 'Confirm amount and destination before executing.';
  execute = makeExecute();
}

class UntaggedService {
  ping(): string {
    return 'pong';
  }
}

const buildModule = async (providers: unknown[]): Promise<TestingModule> => {
  const module = await Test.createTestingModule({
    imports: [DiscoveryModule],
    providers: [ToolRegistry, ...(providers as never[])],
  }).compile();
  await module.init();
  return module;
};

describe('ToolRegistry', () => {
  it('discovers only providers marked with @RegisterAssistantTool', async () => {
    const module = await buildModule([
      BalanceTool,
      TransferTool,
      UntaggedService,
    ]);
    const registry = module.get(ToolRegistry);

    expect(userNames(registry)).toEqual(['get_balance', 'transfer']);
  });

  it('getByName returns the tool instance or null', async () => {
    const module = await buildModule([BalanceTool]);
    const registry = module.get(ToolRegistry);

    expect(registry.getByName('get_balance')?.description).toBe(
      'Returns current balance',
    );
    expect(registry.getByName('nonexistent')).toBeNull();
  });

  it('toRealtimeToolsList projects only name/description/parameters (no playbook)', async () => {
    const module = await buildModule([BalanceTool, TransferTool]);
    const registry = module.get(ToolRegistry);

    const shape = registry
      .toRealtimeToolsList()
      .filter((t) => !RESERVED_META_NAMES.includes(t.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    expect(shape).toEqual([
      {
        type: 'function',
        name: 'get_balance',
        description: 'Returns current balance',
        parameters: { type: 'object', properties: {} },
      },
      {
        type: 'function',
        name: 'transfer',
        description: 'Transfers money',
        parameters: {
          type: 'object',
          properties: { to: { type: 'string' }, amount: { type: 'number' } },
          required: ['to', 'amount'],
        },
      },
    ]);
    for (const entry of shape) {
      expect(entry).not.toHaveProperty('playbook');
    }
  });

  it('throws on empty playbook', async () => {
    @RegisterAssistantTool()
    class NoPlaybookTool implements AssistantTool {
      readonly name = 'oops';
      readonly description = 'no playbook';
      readonly jsonSchema = {};
      readonly playbook = '   ';
      execute = makeExecute();
    }

    await expect(buildModule([NoPlaybookTool])).rejects.toThrow(/playbook/i);
  });

  it('getPreloadedPlaybooks returns only tools that opted in via preloadPlaybook=true', async () => {
    @RegisterAssistantTool()
    class CriticalTool implements AssistantTool {
      readonly name = 'add_transaction';
      readonly description = 'Adds a transaction';
      readonly jsonSchema = {};
      readonly playbook = 'Always confirm amount and description.';
      readonly preloadPlaybook = true;
      execute = makeExecute();
    }

    @RegisterAssistantTool()
    class OptedOutTool implements AssistantTool {
      readonly name = 'list_banks';
      readonly description = 'Lists banks';
      readonly jsonSchema = {};
      readonly playbook = 'List all user banks.';
      readonly preloadPlaybook = false;
      execute = makeExecute();
    }

    const module = await buildModule([
      CriticalTool,
      OptedOutTool,
      BalanceTool,
      TransferTool,
    ]);
    const registry = module.get(ToolRegistry);

    const preloaded = registry.getPreloadedPlaybooks();

    expect(preloaded).toEqual([
      {
        name: 'add_transaction',
        playbook: 'Always confirm amount and description.',
      },
    ]);
  });

  it('getPreloadedPlaybooks returns empty when no tool opted in', async () => {
    const module = await buildModule([BalanceTool, TransferTool]);
    const registry = module.get(ToolRegistry);

    expect(registry.getPreloadedPlaybooks()).toEqual([]);
  });

  it('getPreloadedPlaybooks never includes meta tools even if flag were set', async () => {
    const module = await buildModule([BalanceTool]);
    const registry = module.get(ToolRegistry);

    const preloaded = registry.getPreloadedPlaybooks();
    for (const entry of preloaded) {
      expect(RESERVED_META_NAMES).not.toContain(entry.name);
    }
  });

  it('throws on duplicate tool names', async () => {
    @RegisterAssistantTool()
    class DupA implements AssistantTool {
      readonly name = 'clone';
      readonly description = 'a';
      readonly jsonSchema = {};
      readonly playbook = 'p';
      execute = makeExecute();
    }
    @RegisterAssistantTool()
    class DupB implements AssistantTool {
      readonly name = 'clone';
      readonly description = 'b';
      readonly jsonSchema = {};
      readonly playbook = 'p';
      execute = makeExecute();
    }

    await expect(buildModule([DupA, DupB])).rejects.toThrow(/duplicate/i);
  });
});
