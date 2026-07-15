import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  CreateSessionInput,
  RotateSessionInput,
  Session,
  SessionWithUser,
  SessionsRepository,
} from '../../domain/ports/sessions-repository';

@Injectable()
export class PrismaSessionsRepository implements SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ip: input.ip,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  async findByRefreshTokenHash(hash: string): Promise<SessionWithUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!session) return null;
    return {
      id: session.id,
      userId: session.userId,
      revokedAt: session.revokedAt,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    };
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
      await tx.session.update({
        where: { id: input.previousSessionId },
        data: { revokedAt: input.now },
      });
      const created = await tx.session.create({
        data: {
          userId: input.next.userId,
          refreshTokenHash: input.next.refreshTokenHash,
          userAgent: input.next.userAgent,
          ip: input.next.ip,
          expiresAt: input.next.expiresAt,
        },
      });
      return {
        id: created.id,
        userId: created.userId,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
      };
    });
  }
}
