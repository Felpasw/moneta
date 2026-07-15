import { MS_PER_SECOND } from '../../../@common/domain/constants/time';
import { env } from '../../../config/env';
import { JWT_TTL_SECONDS } from './jwt';

export const REFRESH_COOKIE = {
  name: 'refresh_token',
  options: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/auth/refresh',
    maxAge: JWT_TTL_SECONDS.refresh * MS_PER_SECOND,
  },
};
