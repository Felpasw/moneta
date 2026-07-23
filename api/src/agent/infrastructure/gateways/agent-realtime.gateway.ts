import { Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import {
  TOKEN_SERVICE,
  type TokenService,
} from '~/auth/domain/services/token-service';
import {
  REALTIME_UPSTREAM_FACTORY,
  type RealtimeUpstream,
  type RealtimeUpstreamFactory,
} from '~/agent/domain/ports/realtime-upstream';
import type { TtsService } from '~/agent/domain/ports/tts-service';
import { TTS_SERVICE } from '~/agent/infrastructure/tts/tts.tokens';
import {
  ASSISTANT_PROFILE_REPOSITORY,
  type AssistantProfileRepository,
} from '~/agent/personality/domain/ports/assistant-profile-repository';
import { ToolDispatcher } from '~/agent/tools/infrastructure/tool-dispatcher';
import { ToolRegistry } from '~/agent/tools/infrastructure/tool-registry';
import { env } from '~/config/env';
import { UsersService } from '~/users/users.service';

import { CLOSE_UNAUTHORIZED } from './constants/close-codes';
import { extractHandshakeToken } from './utils/extract-handshake-token';
import { wireRelay } from './utils/wire-relay';
import { wireSystemPrompt } from './utils/wire-system-prompt';
import { wireToolDispatcher } from './utils/wire-tool-dispatcher';
import { wireTtsTap } from './utils/wire-tts-tap';

@WebSocketGateway({ path: '/agent/ws' })
export class AgentRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AgentRealtimeGateway.name);
  private readonly upstreams = new WeakMap<WebSocket, RealtimeUpstream>();

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REALTIME_UPSTREAM_FACTORY)
    private readonly upstreamFactory: RealtimeUpstreamFactory,
    @Inject(TTS_SERVICE) private readonly tts: TtsService,
    @Inject(ASSISTANT_PROFILE_REPOSITORY)
    private readonly profiles: AssistantProfileRepository,
    private readonly users: UsersService,
    private readonly toolRegistry: ToolRegistry,
    private readonly toolDispatcher: ToolDispatcher,
  ) {}

  handleConnection(client: WebSocket, req: IncomingMessage): void {
    const userId = this.authenticate(req);
    if (!userId) {
      this.logger.warn(`ws handshake rejected: unauthorized`);
      client.close(CLOSE_UNAUTHORIZED, 'unauthorized');
      return;
    }
    this.logger.log(`ws client connected for ${userId}`);

    const upstream = this.upstreamFactory.connect(userId);
    this.upstreams.set(client, upstream);
    wireRelay({ client, upstream, logger: this.logger, userId });
    wireSystemPrompt({
      upstream,
      userId,
      profiles: this.profiles,
      users: this.users,
      registry: this.toolRegistry,
      logger: this.logger,
    });
    wireTtsTap({
      client,
      upstream,
      tts: this.tts,
      voiceId: env.TTS_DEFAULT_VOICE_ID,
    });
    wireToolDispatcher({
      client,
      upstream,
      dispatcher: this.toolDispatcher,
      userId,
      logger: this.logger,
    });
  }

  handleDisconnect(client: WebSocket): void {
    this.logger.log(`ws client disconnected`);
    this.upstreams.get(client)?.close();
  }

  private authenticate(req: IncomingMessage): string | null {
    const token = extractHandshakeToken(req);
    if (!token) return null;
    try {
      return this.tokens.verifyAccess(token).sub;
    } catch {
      return null;
    }
  }
}
