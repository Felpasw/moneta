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

import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';

import { ListAvailableVoicesUseCase } from './application/use-cases/list-available-voices.use-case';
import { PreviewVoiceUseCase } from './application/use-cases/preview-voice.use-case';
import { VOICE_ID_PATTERN } from './domain/constants/voice-preview';
import type { TtsVoice } from './domain/ports/tts-service';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly listAvailableVoices: ListAvailableVoicesUseCase,
    private readonly previewVoice: PreviewVoiceUseCase,
  ) {}

  @Get('voices')
  @UseGuards(JwtAuthGuard)
  async voices(): Promise<{ voices: TtsVoice[] }> {
    const voices = await this.listAvailableVoices.execute();
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
