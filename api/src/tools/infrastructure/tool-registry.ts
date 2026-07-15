import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';

import type { AssistantTool } from '../domain/assistant-tool';
import { ASSISTANT_TOOL_METADATA } from './constants/metadata-keys';

interface RealtimeToolDescriptor {
  readonly type: 'function';
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
}

@Injectable()
export class ToolRegistry implements OnModuleInit {
  private readonly byName = new Map<string, AssistantTool>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as AssistantTool | undefined;
      if (!instance || typeof instance !== 'object') continue;

      const marked = this.reflector.get<boolean>(
        ASSISTANT_TOOL_METADATA,
        instance.constructor,
      );
      if (!marked) continue;

      this.assertValidTool(instance);
      if (this.byName.has(instance.name)) {
        throw new Error(`Duplicate assistant tool name: "${instance.name}"`);
      }
      this.byName.set(instance.name, instance);
    }
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
}
