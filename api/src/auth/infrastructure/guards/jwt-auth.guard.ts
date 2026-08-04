import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import {
  TOKEN_SERVICE,
  type DecodedToken,
  type TokenService,
} from '../../domain/services/token-service';
import { ACCESS_COOKIE } from '../constants/cookie';

const BEARER_PREFIX = 'Bearer ';

interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

const extractAccessToken = (req: AuthenticatedRequest): string | null => {
  const cookieValue: unknown = req.cookies?.[ACCESS_COOKIE.name];
  if (typeof cookieValue === 'string' && cookieValue.length > 0) {
    return cookieValue;
  }

  const header = req.headers.authorization;
  if (header && header.startsWith(BEARER_PREFIX)) {
    return header.slice(BEARER_PREFIX.length);
  }

  return null;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }
    try {
      req.user = this.tokens.verifyAccess(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
