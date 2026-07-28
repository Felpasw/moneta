import type { Logger } from '@nestjs/common';

import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';
import type { ToolRegistry } from '~/agent/tools/infrastructure/tool-registry';
import type { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import type { UsersService } from '~/users/users.service';

export interface SystemPromptContext {
  readonly upstream: RealtimeUpstream;
  readonly userId: string;
  readonly profiles: AssistantProfileRepository;
  readonly users: UsersService;
  readonly accounts: ListMyAccountsUseCase;
  readonly registry: ToolRegistry;
  readonly logger: Logger;
}
