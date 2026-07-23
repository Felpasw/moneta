import type { Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';

import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import type { ToolDispatcher } from '~/agent/tools/infrastructure/tool-dispatcher';

export interface ToolDispatcherContext {
  readonly client: WebSocket;
  readonly upstream: RealtimeUpstream;
  readonly dispatcher: ToolDispatcher;
  readonly userId: string;
  readonly logger: Logger;
}
