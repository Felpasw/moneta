import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';

import { ListAvailableVoicesUseCase } from './application/use-cases/list-available-voices.use-case';
import type { TtsVoice } from './domain/ports/tts-client';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly listAvailableVoices: ListAvailableVoicesUseCase,
  ) {}

  @Get('voices')
  @UseGuards(JwtAuthGuard)
  async voices(): Promise<{ voices: TtsVoice[] }> {
    const voices = await this.listAvailableVoices.execute();
    return { voices };
  }
}
