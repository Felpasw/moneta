import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { redactSecrets } from '../../../@common/infrastructure/logging/redact-secrets';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  AuthAuditLogRepository,
  RecordAuditEventInput,
} from '../../domain/ports/auth-audit-log-repository';

@Injectable()
export class PrismaAuthAuditLogRepository implements AuthAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditEventInput): Promise<void> {
    await this.prisma.authAuditLog.create({
      data: {
        event: input.event,
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
        context: redactSecrets(input.context) as Prisma.InputJsonValue,
      },
    });
  }
}
