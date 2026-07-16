import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';

import type { AssistantTool } from '../domain/assistant-tool';
import { MetaToolName } from '../domain/constants/meta-tool-name';
import { ToolHelpErrorCode } from '../domain/constants/tool-help-error-code';
import type { ToolHelpResult } from '../domain/types/tool-help-result';
import { ASSISTANT_TOOL_METADATA } from './constants/metadata-keys';
import { GetToolHelpMetaTool } from './meta/get-tool-help.meta-tool';

interface RealtimeToolDescriptor {
  readonly type: 'function';
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
}

const RESERVED_META_NAMES: readonly string[] = Object.values(MetaToolName);

@Injectable()
export class ToolRegistry implements OnModuleInit {
  private readonly byName = new Map<string, AssistantTool>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    this.discoverUserTools();
    this.registerMetaTools();
  }

  getAll(): AssistantTool[] {
    return Array.from(this.byName.values());
  }

  getByName(name: string): AssistantTool | null {
    return this.byName.get(name) ?? null;
  }

  toRealtimeToolsList(): RealtimeToolDescriptor[] {
    return this.getAll().map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.jsonSchema,
    }));
  }

  getToolHelp(toolName: string): ToolHelpResult {
    const tool = this.byName.get(toolName);
    if (!tool) {
      return {
        found: false,
        error: { error: ToolHelpErrorCode.ToolNotFound, toolName },
      };
    }
    return {
      found: true,
      entry: {
        name: tool.name,
        description: tool.description,
        playbook: tool.playbook,
      },
    };
  }

  private discoverUserTools(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as AssistantTool | undefined;
      if (!instance || typeof instance !== 'object') continue;

      const marked = this.reflector.get<boolean>(
        ASSISTANT_TOOL_METADATA,
        instance.constructor,
      );
      if (!marked) continue;

      this.assertValidTool(instance);
      this.assertNotReservedName(instance.name);
      if (this.byName.has(instance.name)) {
        throw new Error(`Duplicate assistant tool name: "${instance.name}"`);
      }
      this.byName.set(instance.name, instance);
    }
  }

  private registerMetaTools(): void {
    const getToolHelp = new GetToolHelpMetaTool((name) =>
      this.getToolHelp(name),
    );
    this.byName.set(getToolHelp.name, getToolHelp);
  }

  private assertValidTool(tool: AssistantTool): void {
    if (!tool.name || tool.name.trim().length === 0) {
      throw new Error('AssistantTool is missing a name');
    }
    if (!tool.playbook || tool.playbook.trim().length === 0) {
      throw new Error(
        `AssistantTool "${tool.name}" is missing a playbook (required for tool help)`,
      );
    }
  }

  private assertNotReservedName(name: string): void {
    if (RESERVED_META_NAMES.includes(name)) {
      throw new Error(`AssistantTool "${name}" uses a reserved meta-tool name`);
    }
  }
}
