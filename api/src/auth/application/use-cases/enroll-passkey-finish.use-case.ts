import { Inject, Injectable } from '@nestjs/common';

import {
  EPHEMERAL_STORE,
  type EphemeralStore,
} from '../../../@common/domain/ports/ephemeral-store';
import { env } from '../../../config/env';
import {
  PasskeyEnrollmentFailedError,
  PasskeyEnrollmentFailedReason,
} from '../../domain/errors/passkey-enrollment-failed.error';
import {
  AUTH_AUDIT_LOG_REPOSITORY,
  AuthAuditEventType,
  type AuthAuditLogRepository,
} from '../../domain/ports/auth-audit-log-repository';
import {
  PASSKEY_CREDENTIALS_REPOSITORY,
  type PasskeyCredentialsRepository,
} from '../../domain/ports/passkey-credentials-repository';
import {
  WEBAUTHN_SERVICE,
  type WebAuthnService,
} from '../../domain/services/webauthn-service';
import {
  WEBAUTHN_RP,
  passkeyChallengeKey,
} from '../../infrastructure/constants/passkey';
import type { EnrollPasskeyFinishInput } from '../types/passkey';

@Injectable()
export class EnrollPasskeyFinishUseCase {
  constructor(
    @Inject(PASSKEY_CREDENTIALS_REPOSITORY)
    private readonly passkeys: PasskeyCredentialsRepository,
    @Inject(WEBAUTHN_SERVICE) private readonly webauthn: WebAuthnService,
    @Inject(EPHEMERAL_STORE)
    private readonly ephemeralStore: EphemeralStore,
    @Inject(AUTH_AUDIT_LOG_REPOSITORY)
    private readonly audit: AuthAuditLogRepository,
  ) {}

  async execute(input: EnrollPasskeyFinishInput): Promise<void> {
    const stored = await this.ephemeralStore.getAndDelete<{
      challenge: string;
    }>(passkeyChallengeKey.enroll(input.userId));

    if (!stored) {
      throw new PasskeyEnrollmentFailedError(
        PasskeyEnrollmentFailedReason.CHALLENGE_NOT_FOUND,
      );
    }

    const result = await this.webauthn.verifyRegistrationResponse({
      response: input.response,
      expectedChallenge: stored.challenge,
      expectedOrigin: env.WEB_ORIGIN,
      expectedRPID: WEBAUTHN_RP.id,
    });

    if (!result.verified || !result.credential) {
      throw new PasskeyEnrollmentFailedError(
        PasskeyEnrollmentFailedReason.VERIFICATION_FAILED,
      );
    }

    await this.passkeys.create({
      userId: input.userId,
      credentialId: result.credential.credentialId,
      publicKey: result.credential.publicKey,
      counter: result.credential.counter,
      transports: result.credential.transports,
      deviceType: result.credential.deviceType,
      backedUp: result.credential.backedUp,
    });

    await this.audit.record({
      event: AuthAuditEventType.PASSKEY_ENROLLED,
      userId: input.userId,
      context: {
        credentialId: result.credential.credentialId,
        deviceType: result.credential.deviceType,
      },
    });
  }
}
