import { Inject, Injectable } from '@nestjs/common';

import { MS_PER_SECOND } from '../../../@common/domain/constants/time';
import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import {
  EPHEMERAL_STORE,
  type EphemeralStore,
} from '../../../@common/domain/ports/ephemeral-store';
import { env } from '../../../config/env';
import {
  PasskeyAuthenticationFailedError,
  PasskeyAuthenticationFailedReason,
} from '../../domain/errors/passkey-authentication-failed.error';
import {
  PASSKEY_CREDENTIALS_REPOSITORY,
  type PasskeyCredentialsRepository,
} from '../../domain/ports/passkey-credentials-repository';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepository,
} from '../../domain/ports/sessions-repository';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../domain/services/token-service';
import {
  WEBAUTHN_SERVICE,
  type WebAuthnService,
} from '../../domain/services/webauthn-service';
import { JWT_TTL_SECONDS } from '../../infrastructure/constants/jwt';
import {
  WEBAUTHN_RP,
  passkeyChallengeKey,
} from '../../infrastructure/constants/passkey';
import { sha256 } from '../../infrastructure/util/sha256';
import type { LoginResult } from '../types/login';
import type { AuthPasskeyFinishInput } from '../types/passkey';

@Injectable()
export class AuthPasskeyFinishUseCase {
  constructor(
    @Inject(PASSKEY_CREDENTIALS_REPOSITORY)
    private readonly passkeys: PasskeyCredentialsRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionsRepository,
    @Inject(WEBAUTHN_SERVICE) private readonly webauthn: WebAuthnService,
    @Inject(EPHEMERAL_STORE)
    private readonly ephemeralStore: EphemeralStore,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: AuthPasskeyFinishInput): Promise<LoginResult> {
    const stored = await this.ephemeralStore.getAndDelete<{
      challenge: string;
    }>(passkeyChallengeKey.auth(input.sessionId));
    if (!stored) {
      throw new PasskeyAuthenticationFailedError(
        PasskeyAuthenticationFailedReason.CHALLENGE_NOT_FOUND,
      );
    }

    const credentialId = input.response.id;
    if (!credentialId) {
      throw new PasskeyAuthenticationFailedError(
        PasskeyAuthenticationFailedReason.CREDENTIAL_NOT_FOUND,
      );
    }

    const credential = await this.passkeys.findByCredentialId(credentialId);
    if (!credential) {
      throw new PasskeyAuthenticationFailedError(
        PasskeyAuthenticationFailedReason.CREDENTIAL_NOT_FOUND,
      );
    }

    const result = await this.webauthn.verifyAuthenticationResponse({
      response: input.response,
      expectedChallenge: stored.challenge,
      expectedOrigin: env.WEB_ORIGIN,
      expectedRPID: WEBAUTHN_RP.id,
      credential: {
        id: credential.credentialId,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports,
      },
    });

    if (!result.verified || result.newCounter === undefined) {
      throw new PasskeyAuthenticationFailedError(
        PasskeyAuthenticationFailedReason.VERIFICATION_FAILED,
      );
    }

    const now = this.clock.now();
    await this.passkeys.updateCounter(credentialId, result.newCounter, now);

    const refreshToken = this.tokens.signRefresh({ sub: credential.userId });
    const refreshTokenHash = sha256(refreshToken);
    const expiresAt = new Date(
      now.getTime() + JWT_TTL_SECONDS.refresh * MS_PER_SECOND,
    );

    await this.sessions.create({
      userId: credential.userId,
      refreshTokenHash,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt,
    });

    const accessToken = this.tokens.signAccess({ sub: credential.userId });

    return {
      user: credential.user,
      accessToken,
      refreshToken,
    };
  }
}
