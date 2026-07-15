import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  CreatePasskeyCredentialInput,
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

  async create(input: CreatePasskeyCredentialInput): Promise<void> {
    await this.prisma.passkeyCredential.create({
      data: {
        userId: input.userId,
        credentialId: input.credentialId,
        publicKey: Buffer.from(input.publicKey),
        counter: BigInt(input.counter),
        transports: input.transports,
        deviceType: input.deviceType,
        backedUp: input.backedUp,
      },
    });
  }
}
