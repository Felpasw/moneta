import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { ZodValidationPipe } from '../@common/infrastructure/pipes/zod-validation.pipe';
import { AuthPasskeyBeginUseCase } from './application/use-cases/auth-passkey-begin.use-case';
import { AuthPasskeyFinishUseCase } from './application/use-cases/auth-passkey-finish.use-case';
import { EnrollPasskeyBeginUseCase } from './application/use-cases/enroll-passkey-begin.use-case';
import { EnrollPasskeyFinishUseCase } from './application/use-cases/enroll-passkey-finish.use-case';
import { PasskeyAuthenticationFailedError } from './domain/errors/passkey-authentication-failed.error';
import { PasskeyEnrollmentFailedError } from './domain/errors/passkey-enrollment-failed.error';
import { UserNotFoundError } from './domain/errors/user-not-found.error';
import type { DecodedToken } from './domain/services/token-service';
import {
  authPasskeyBeginBodySchema,
  authPasskeyFinishBodySchema,
  enrollPasskeyFinishBodySchema,
  type AuthPasskeyBeginBodyDto,
  type AuthPasskeyFinishBodyDto,
  type EnrollPasskeyFinishBodyDto,
} from './dto/passkey.dto';
import { REFRESH_COOKIE } from './infrastructure/constants/cookie';
import { CurrentUser } from './infrastructure/decorators/current-user.decorator';
import { IpEmailThrottlerGuard } from './infrastructure/guards/ip-email-throttler.guard';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';

@Controller('auth/passkey')
export class PasskeyController {
  constructor(
    private readonly enrollBegin: EnrollPasskeyBeginUseCase,
    private readonly enrollFinish: EnrollPasskeyFinishUseCase,
    private readonly authBegin: AuthPasskeyBeginUseCase,
    private readonly authFinish: AuthPasskeyFinishUseCase,
  ) {}

  @Post('enroll/begin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async doEnrollBegin(@CurrentUser() user: DecodedToken) {
    try {
      return await this.enrollBegin.execute({ userId: user.sub });
    } catch (e) {
      if (e instanceof UserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  @Post('enroll/finish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async doEnrollFinish(
    @CurrentUser() user: DecodedToken,
    @Body(new ZodValidationPipe(enrollPasskeyFinishBodySchema))
    body: EnrollPasskeyFinishBodyDto,
  ) {
    try {
      await this.enrollFinish.execute({
        userId: user.sub,
        response: body.response,
      });
    } catch (e) {
      if (e instanceof PasskeyEnrollmentFailedError) {
        throw new BadRequestException('Passkey enrollment failed');
      }
      throw e;
    }
  }

  @Post('login/begin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IpEmailThrottlerGuard)
  async doAuthBegin(
    @Body(new ZodValidationPipe(authPasskeyBeginBodySchema))
    body: AuthPasskeyBeginBodyDto,
  ) {
    return this.authBegin.execute({ email: body.email });
  }

  @Post('login/finish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IpEmailThrottlerGuard)
  async doAuthFinish(
    @Body(new ZodValidationPipe(authPasskeyFinishBodySchema))
    body: AuthPasskeyFinishBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authFinish.execute({
        sessionId: body.sessionId,
        response: body.response,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      res.cookie(
        REFRESH_COOKIE.name,
        result.refreshToken,
        REFRESH_COOKIE.options,
      );
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (e) {
      if (e instanceof PasskeyAuthenticationFailedError) {
        throw new UnauthorizedException('Passkey authentication failed');
      }
      throw e;
    }
  }
}
