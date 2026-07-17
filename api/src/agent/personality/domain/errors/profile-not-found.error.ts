export class ProfileNotFoundError extends Error {
  constructor(userId: string) {
    super(`Assistant profile not found for user "${userId}"`);
    this.name = 'ProfileNotFoundError';
  }
}
