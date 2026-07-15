import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import type {
  DecodedToken,
  TokenPayload,
  TokenService,
} from '../domain/services/token-service';
import { JWT_TTL_SECONDS } from './constants/jwt';

@Injectable()
export class JwtTokenService implements TokenService {
  signAccess(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: JWT_TTL_SECONDS.access,
    });
  }

  verifyAccess(token: string): DecodedToken {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;
  }

  signRefresh(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: JWT_TTL_SECONDS.refresh,
    });
  }

  verifyRefresh(token: string): DecodedToken {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as DecodedToken;
  }
}
