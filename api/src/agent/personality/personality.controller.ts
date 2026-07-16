import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '~/@common/infrastructure/pipes/zod-validation.pipe';
import { CurrentUser } from '~/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';

import { GetAssistantProfileUseCase } from './application/use-cases/get-assistant-profile.use-case';
import { UpdateAssistantProfileUseCase } from './application/use-cases/update-assistant-profile.use-case';
import { InvalidAvatarUrlError } from './domain/errors/invalid-avatar-url.error';
import { ProfileNotFoundError } from './domain/errors/profile-not-found.error';
import type { AssistantProfile } from './domain/types/assistant-profile';
import {
  updateProfileSchema,
  type UpdateProfileDto,
} from './dto/update-profile.dto';

interface AuthUser {
  readonly sub: string;
}

@Controller('agent/profile')
@UseGuards(JwtAuthGuard)
export class PersonalityController {
  constructor(
    private readonly getProfile: GetAssistantProfileUseCase,
    private readonly updateProfile: UpdateAssistantProfileUseCase,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<AssistantProfile> {
    try {
      return await this.getProfile.execute(user.sub);
    } catch (e) {
      if (e instanceof ProfileNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Patch()
  async patch(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<AssistantProfile> {
    try {
      return await this.updateProfile.execute(user.sub, dto);
    } catch (e) {
      if (e instanceof ProfileNotFoundError) {
        throw new NotFoundException(e.message);
      }
      if (e instanceof InvalidAvatarUrlError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
