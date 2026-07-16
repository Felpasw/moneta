export const USER_SIGNED_UP_EVENT = 'auth.user.signed_up';

export interface UserSignedUpPayload {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
}
