import { sha256 } from '~/auth/infrastructure/util/sha256';

describe('sha256', () => {
  it('produces the well-known SHA-256 hex digest for "abc"', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('produces different digests for different inputs', () => {
    expect(sha256('foo')).not.toBe(sha256('bar'));
  });

  it('is deterministic — same input yields same digest', () => {
    expect(sha256('same')).toBe(sha256('same'));
  });

  it('produces a 64-character hex string', () => {
    const digest = sha256('anything');
    expect(digest).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(digest)).toBe(true);
  });
});
