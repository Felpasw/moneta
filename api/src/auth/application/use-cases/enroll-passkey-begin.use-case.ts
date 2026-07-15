import { Inject, Injectable } from '@nestjs/common';

import {
  EPHEMERAL_STORE,
  type EphemeralStore,
} from '../../../@common/domain/ports/ephemeral-store';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../../users/domain/ports/users-repository';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
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
  EnrollPasskeyBeginInput,
  EnrollPasskeyBeginResult,
} from '../types/passkey';

@Injectable()
export class EnrollPasskeyBeginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(PASSKEY_CREDENTIALS_REPOSITORY)
    private readonly passkeys: PasskeyCredentialsRepository,
    @Inject(WEBAUTHN_SERVICE) private readonly webauthn: WebAuthnService,
    @Inject(EPHEMERAL_STORE)
    private readonly ephemeralStore: EphemeralStore,
  ) {}

  async execute(
    input: EnrollPasskeyBeginInput,
  ): Promise<EnrollPasskeyBeginResult> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const existing = await this.passkeys.findByUserId(input.userId);

    const options = await this.webauthn.generateRegistrationOptions({
      rpID: WEBAUTHN_RP.id,
      rpName: WEBAUTHN_RP.name,
      userID: Buffer.from(user.id, 'utf-8'),
      userName: user.email,
      userDisplayName: user.name,
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: c.transports,
      })),
    });

    await this.ephemeralStore.set(
      passkeyChallengeKey.enroll(input.userId),
      { challenge: options.challenge },
      PASSKEY_CHALLENGE_TTL_SECONDS,
    );

    return options;
  }
}
