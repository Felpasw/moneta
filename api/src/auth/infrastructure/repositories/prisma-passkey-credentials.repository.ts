import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  PasskeyCredentialSummary,
  PasskeyCredentialsRepository,
} from '../../domain/ports/passkey-credentials-repository';

@Injectable()
export class PrismaPasskeyCredentialsRepository implements PasskeyCredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PasskeyCredentialSummary[]> {
    const rows = await this.prisma.passkeyCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });
    return rows.map((row) => ({
      credentialId: row.credentialId,
      transports: row.transports,
    }));
  }
}
