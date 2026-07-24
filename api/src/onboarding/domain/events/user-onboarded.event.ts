export const USER_ONBOARDED_EVENT = 'users.onboarded';

export interface UserOnboardedPayload {
  readonly userId: string;
  readonly onboardedAt: Date;
}
