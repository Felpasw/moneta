import type { IncomingMessage } from 'node:http';

import {
  BEARER_SUBPROTOCOL_PREFIX,
  HANDSHAKE_TOKEN_QUERY_PARAM,
} from '../constants/auth-transport';

type TokenStrategy = (req: IncomingMessage) => string | null;

const fromQueryParam: TokenStrategy = (req) => {
  const url = req.url ?? '';
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return null;
  return new URLSearchParams(url.slice(queryStart + 1)).get(
    HANDSHAKE_TOKEN_QUERY_PARAM,
  );
};

const fromBearerSubprotocol: TokenStrategy = (req) => {
  const proto = req.headers['sec-websocket-protocol'];
  if (typeof proto !== 'string') return null;
  const bearer = proto
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.startsWith(BEARER_SUBPROTOCOL_PREFIX));
  if (!bearer) return null;
  return bearer.slice(BEARER_SUBPROTOCOL_PREFIX.length);
};

const STRATEGIES: readonly TokenStrategy[] = [
  fromQueryParam,
  fromBearerSubprotocol,
];

export const extractHandshakeToken = (req: IncomingMessage): string | null => {
  for (const strategy of STRATEGIES) {
    const token = strategy(req);
    if (token) return token;
  }
  return null;
};
