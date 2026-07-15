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

  async findByCredentialId(
    credentialId: string,
  ): Promise<PasskeyCredentialWithUser | null> {
    const row = await this.prisma.passkeyCredential.findUnique({
      where: { credentialId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!row) return null;
    return {
      credentialId: row.credentialId,
      userId: row.userId,
      publicKey: new Uint8Array(row.publicKey),
      counter: Number(row.counter),
      transports: row.transports,
      user: {
        id: row.user.id,
        email: row.user.email,
        name: row.user.name,
      },
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
