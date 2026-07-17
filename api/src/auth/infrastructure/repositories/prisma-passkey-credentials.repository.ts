import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  CreatePasskeyCredentialInput,
  PasskeyCredentialSummary,
  PasskeyCredentialWithUser,
  PasskeyCredentialsRepository,
} from '../../domain/ports/passkey-credentials-repository';

@Injectable()
export class PrismaPasskeyCredentialsRepository implements PasskeyCredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PasskeyCredentialSummary[]> {
    return this.prisma.passkeyCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });
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

  async findByCredentialId(
    credentialId: string,
  ): Promise<PasskeyCredentialWithUser | null> {
    const row = await this.prisma.passkeyCredential.findUnique({
      where: { credentialId },
      select: {
        credentialId: true,
        userId: true,
        publicKey: true,
        counter: true,
        transports: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!row) return null;
    return {
      ...row,
      publicKey: new Uint8Array(row.publicKey),
      counter: Number(row.counter),
    };
  }

  async updateCounter(
    credentialId: string,
    counter: number,
    lastUsedAt: Date,
  ): Promise<void> {
    await this.prisma.passkeyCredential.update({
      where: { credentialId },
      data: {
        counter: BigInt(counter),
        lastUsedAt,
      },
    });
  }
}
