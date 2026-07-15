import { Injectable } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';

import type {
  GenerateRegistrationOptionsInput,
  RegistrationOptions,
  VerifiedRegistration,
  VerifyRegistrationInput,
  WebAuthnService,
} from '../../domain/services/webauthn-service';

@Injectable()
export class SimpleWebAuthnService implements WebAuthnService {
  async generateRegistrationOptions(
    input: GenerateRegistrationOptionsInput,
  ): Promise<RegistrationOptions> {
    const options = await generateRegistrationOptions({
      rpID: input.rpID,
      rpName: input.rpName,
      userID: input.userID as Uint8Array<ArrayBuffer>,
      userName: input.userName,
      userDisplayName: input.userDisplayName,
      attestationType: 'none',
      excludeCredentials: input.excludeCredentials.map((c) => ({
        id: c.id,
        transports: c.transports as AuthenticatorTransportFuture[] | undefined,
      })),
    });
    return options as unknown as RegistrationOptions;
  }

  async verifyRegistrationResponse(
    input: VerifyRegistrationInput,
  ): Promise<VerifiedRegistration> {
    const result = await verifyRegistrationResponse({
      response: input.response as RegistrationResponseJSON,
      expectedChallenge: input.expectedChallenge,
      expectedOrigin: input.expectedOrigin,
      expectedRPID: input.expectedRPID,
    });

    if (!result.verified || !result.registrationInfo) {
      return { verified: result.verified };
    }

    const info = result.registrationInfo;
    return {
      verified: true,
      credential: {
        credentialId: info.credential.id,
        publicKey: info.credential.publicKey,
        counter: info.credential.counter,
        transports: info.credential.transports ?? [],
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
      },
    };
  }
}
