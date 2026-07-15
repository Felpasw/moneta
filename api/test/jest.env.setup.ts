process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-do-not-use-in-prod';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-do-not-use-in-prod';
process.env.WEB_ORIGIN ??= 'http://localhost:3000';
process.env.PORT ??= '3333';
