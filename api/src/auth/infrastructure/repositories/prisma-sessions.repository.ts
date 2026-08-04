import { Injectable } from '@nestjs/common';

import {
  InvalidRefreshTokenError,
  InvalidRefreshTokenReason,
} from '../../domain/errors/invalid-refresh-token.error';
import type {
  CreateSessionInput,
  RotateSessionInput,
  Session,
  SessionWithUser,
  SessionsRepository,
} from '../../domain/ports/sessions-repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaSessionsRepository implements SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ip: input.ip,
        expiresAt: input.expiresAt,
      },
      select: { id: true, userId: true, createdAt: true, expiresAt: true },
    });
  }

  async findByRefreshTokenHash(hash: string): Promise<SessionWithUser | null> {
    return this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
            onboardedAt: true,
          },
        },
      },
    });
  }

  async revokeByRefreshTokenHash(hash: string, now: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async revokeAllByUserId(userId: string, now: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async rotate(input: RotateSessionInput): Promise<Session> {
    return this.prisma.$transaction(async (tx) => {
      const revoked = await tx.session.updateMany({
        where: { id: input.previousSessionId, revokedAt: null },
        data: { revokedAt: input.now },
      });
      if (revoked.count === 0) {
        throw new InvalidRefreshTokenError(
          InvalidRefreshTokenReason.SESSION_REVOKED,
        );
      }
      return tx.session.create({
        data: {
          userId: input.next.userId,
          refreshTokenHash: input.next.refreshTokenHash,
          userAgent: input.next.userAgent,
          ip: input.next.ip,
          expiresAt: input.next.expiresAt,
        },
        select: { id: true, userId: true, createdAt: true, expiresAt: true },
      });
    });
  }
}
