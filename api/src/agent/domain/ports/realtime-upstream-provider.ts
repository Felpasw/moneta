export const REALTIME_UPSTREAM_PROVIDER = Symbol('REALTIME_UPSTREAM_PROVIDER');

export interface RealtimeConnectionConfig {
  readonly url: string;
  readonly headers: Record<string, string>;
}

export interface RealtimeUpstreamProvider {
  buildConnectionConfig(): RealtimeConnectionConfig;
}
