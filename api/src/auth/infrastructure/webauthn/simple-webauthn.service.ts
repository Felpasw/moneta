import { Injectable } from '@nestjs/common';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';

import type {
  GenerateRegistrationOptionsInput,
  RegistrationOptions,
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
}
