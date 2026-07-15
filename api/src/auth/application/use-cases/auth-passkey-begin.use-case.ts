import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import {
  EPHEMERAL_STORE,
  type EphemeralStore,
} from '../../../@common/domain/ports/ephemeral-store';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../../users/domain/ports/users-repository';
import {
  PASSKEY_CREDENTIALS_REPOSITORY,
  type PasskeyCredentialsRepository,
} from '../../domain/ports/passkey-credentials-repository';
import {
  WEBAUTHN_SERVICE,
  type WebAuthnService,
} from '../../domain/services/webauthn-service';
import {
  PASSKEY_CHALLENGE_TTL_SECONDS,
  WEBAUTHN_RP,
  passkeyChallengeKey,
} from '../../infrastructure/constants/passkey';
import type {
  AuthPasskeyBeginInput,
  AuthPasskeyBeginResult,
} from '../types/passkey';

@Injectable()
export class AuthPasskeyBeginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(PASSKEY_CREDENTIALS_REPOSITORY)
    private readonly passkeys: PasskeyCredentialsRepository,
    @Inject(WEBAUTHN_SERVICE) private readonly webauthn: WebAuthnService,
    @Inject(EPHEMERAL_STORE)
    private readonly ephemeralStore: EphemeralStore,
  ) {}

  async execute(input: AuthPasskeyBeginInput): Promise<AuthPasskeyBeginResult> {
    const allowCredentials = await this.resolveAllowCredentials(input.email);

    const options = await this.webauthn.generateAuthenticationOptions({
      rpID: WEBAUTHN_RP.id,
      allowCredentials,
    });

    const sessionId = randomUUID();
    await this.ephemeralStore.set(
      passkeyChallengeKey.auth(sessionId),
      { challenge: options.challenge },
      PASSKEY_CHALLENGE_TTL_SECONDS,
    );

    return { sessionId, options };
  }

  private async resolveAllowCredentials(
    email: string | undefined,
  ): Promise<Array<{ id: string; transports?: string[] }>> {
    if (!email) return [];
    const normalized = email.toLowerCase().trim();
    const user = await this.users.findByEmail(normalized);
    if (!user) return [];
    const credentials = await this.passkeys.findByUserId(user.id);
    return credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    }));
  }
}
