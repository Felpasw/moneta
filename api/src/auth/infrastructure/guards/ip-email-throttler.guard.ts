import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

const ANONYMOUS_KEY = 'anonymous';

@Injectable()
export class IpEmailThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const ip = req.ips?.[0] ?? req.ip ?? ANONYMOUS_KEY;
    const body = req.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === 'string' && body.email.length > 0
        ? body.email.toLowerCase()
        : ANONYMOUS_KEY;
    return Promise.resolve(`${ip}:${email}`);
  }
}
