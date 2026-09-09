import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '~/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';

import { ListAvailableVoicesUseCase } from './application/use-cases/list-available-voices.use-case';
import { PreviewVoiceUseCase } from './application/use-cases/preview-voice.use-case';
import { VOICE_ID_PATTERN } from './domain/constants/voice-preview';
import type { TtsVoiceWithMatch } from './domain/types/tts-voice-with-match';

interface AuthUser {
  readonly sub: string;
}

@Controller('agent')
export class AgentController {
  constructor(
    private readonly listAvailableVoices: ListAvailableVoicesUseCase,
    private readonly previewVoice: PreviewVoiceUseCase,
  ) {}

  @Get('voices')
  @UseGuards(JwtAuthGuard)
  async voices(
    @CurrentUser() user: AuthUser,
  ): Promise<{ voices: TtsVoiceWithMatch[] }> {
    const voices = await this.listAvailableVoices.execute({
      userId: user.sub,
    });
    return { voices };
  }

  @Post('voices/:voiceId/preview')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async preview(@Param('voiceId') voiceId: string): Promise<StreamableFile> {
    if (!VOICE_ID_PATTERN.test(voiceId)) {
      throw new BadRequestException('invalid voiceId');
    }
    const audio = await this.previewVoice.execute(voiceId);
    return new StreamableFile(audio, { type: 'audio/mpeg' });
  }
}
