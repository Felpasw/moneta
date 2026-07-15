import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(env.PORT);
}
void bootstrap();
