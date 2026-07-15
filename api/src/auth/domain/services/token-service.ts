export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenPayload {
  sub: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface TokenService {
  signAccess(payload: TokenPayload): string;
  verifyAccess(token: string): DecodedToken;
  signRefresh(payload: TokenPayload): string;
  verifyRefresh(token: string): DecodedToken;
}
