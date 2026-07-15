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

const BEARER_PREFIX = 'Bearer ';

interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(BEARER_PREFIX.length);
    try {
      req.user = this.tokens.verifyAccess(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
