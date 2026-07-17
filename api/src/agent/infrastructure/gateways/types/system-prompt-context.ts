import type { Logger } from '@nestjs/common';

import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';

export interface SystemPromptContext {
  readonly upstream: RealtimeUpstream;
  readonly userId: string;
  readonly profiles: AssistantProfileRepository;
  readonly logger: Logger;
}
