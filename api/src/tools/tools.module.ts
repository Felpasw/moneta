import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { ToolRegistry } from './infrastructure/tool-registry';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [ToolRegistry],
  exports: [ToolRegistry],
})
export class ToolsModule {}
