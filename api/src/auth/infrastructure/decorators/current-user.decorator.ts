import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { DecodedToken } from '../../domain/services/token-service';

interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DecodedToken => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user) {
      throw new Error(
        '@CurrentUser() used on a route that is not protected by JwtAuthGuard',
      );
    }
    return req.user;
  },
);
