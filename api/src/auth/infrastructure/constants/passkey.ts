import { env } from '../../../config/env';

export const PASSKEY_CHALLENGE_TTL_SECONDS = 5 * 60;

export const passkeyChallengeKey = {
  enroll: (userId: string): string => `passkey_challenge:enroll:${userId}`,
  auth: (sessionId: string): string => `passkey_challenge:auth:${sessionId}`,
};

export const WEBAUTHN_RP = {
  id: env.RP_ID,
  name: env.RP_NAME,
};
