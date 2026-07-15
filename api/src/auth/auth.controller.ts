import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { ZodValidationPipe } from '../@common/infrastructure/pipes/zod-validation.pipe';
import { LoginWithPasswordUseCase } from './application/use-cases/login-with-password.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { SignupWithPasswordUseCase } from './application/use-cases/signup-with-password.use-case';
import { InvalidCredentialsError } from './domain/errors/invalid-credentials.error';
import { InvalidNameError } from './domain/errors/invalid-name.error';
import { InvalidRefreshTokenError } from './domain/errors/invalid-refresh-token.error';
import { EmailAlreadyRegisteredError } from '../users/domain/errors/email-already-registered.error';
import { logoutBodySchema, type LogoutBodyDto } from './dto/logout.dto';
import { loginSchema, type LoginDto } from './dto/login.dto';
import { refreshBodySchema, type RefreshBodyDto } from './dto/refresh.dto';
import { signupSchema, type SignupDto } from './dto/signup.dto';
import { REFRESH_COOKIE } from './infrastructure/constants/cookie';

const extractRefreshToken = (
  req: Request,
  body: { refreshToken?: string },
): string | undefined => {
  if (body.refreshToken) return body.refreshToken;
  const cookieValue: unknown = req.cookies?.[REFRESH_COOKIE.name];
  if (typeof cookieValue === 'string' && cookieValue.length > 0) {
    return cookieValue;
  }
  return undefined;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signup: SignupWithPasswordUseCase,
    private readonly login: LoginWithPasswordUseCase,
    private readonly refresh: RefreshTokensUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async doSignup(@Body(new ZodValidationPipe(signupSchema)) dto: SignupDto) {
    try {
      const user = await this.signup.execute(dto);
      return { user };
    } catch (e) {
      if (e instanceof InvalidNameError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async doLogin(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.login.execute({
        email: dto.email,
        password: dto.password,
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
      if (e instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw e;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async doRefresh(
    @Body(new ZodValidationPipe(refreshBodySchema)) body: RefreshBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = extractRefreshToken(req, body);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    try {
      const result = await this.refresh.execute({
        refreshToken,
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
      if (e instanceof InvalidRefreshTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw e;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async doLogout(
    @Body(new ZodValidationPipe(logoutBodySchema)) body: LogoutBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = extractRefreshToken(req, body);
    if (refreshToken) {
      await this.logout.execute({ refreshToken });
    }
    res.clearCookie(REFRESH_COOKIE.name, { path: REFRESH_COOKIE.options.path });
  }
}
