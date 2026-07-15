import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(config: ConfigService) {
    this.accessSecret = config.getOrThrow<string>(env.JWT_ACCESS_SECRET);
    this.refreshSecret = config.getOrThrow<string>(env.JWT_REFRESH_SECRET);
  }

  signAccess(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: JWT_TTL_SECONDS.access,
    });
  }

  verifyAccess(token: string): DecodedToken {
    return jwt.verify(token, this.accessSecret) as DecodedToken;
  }

  signRefresh(payload: TokenPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: JWT_TTL_SECONDS.refresh,
    });
  }

  verifyRefresh(token: string): DecodedToken {
    return jwt.verify(token, this.refreshSecret) as DecodedToken;
  }
}
