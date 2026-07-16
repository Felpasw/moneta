import type { AssistantProfile } from '../types/assistant-profile';
import type { CreateAssistantProfileInput } from '../types/create-assistant-profile-input';

export const ASSISTANT_PROFILE_REPOSITORY = Symbol(
  'ASSISTANT_PROFILE_REPOSITORY',
);

export interface AssistantProfileRepository {
  findByUserId(userId: string): Promise<AssistantProfile | null>;
  create(input: CreateAssistantProfileInput): Promise<AssistantProfile>;
}
