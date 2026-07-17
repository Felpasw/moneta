import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { ToolDispatcher } from './infrastructure/tool-dispatcher';
import { ToolRegistry } from './infrastructure/tool-registry';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [ToolRegistry, ToolDispatcher],
  exports: [ToolRegistry, ToolDispatcher],
})
export class ToolsModule {}
