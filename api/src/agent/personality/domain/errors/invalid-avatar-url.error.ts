export class InvalidAvatarUrlError extends Error {
  constructor(url: string) {
    super(
      `Avatar URL must point to a Ready Player Me asset (https://models.readyplayer.me/): "${url}"`,
    );
    this.name = 'InvalidAvatarUrlError';
  }
}
