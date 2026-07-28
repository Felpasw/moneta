export class InvalidAvatarUrlError extends Error {
  constructor(url: string) {
    super(
      `Avatar URL must match the DiceBear pattern "dicebear:{style}:{seed}": "${url}"`,
    );
    this.name = 'InvalidAvatarUrlError';
  }
}
