import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccountNotFoundError } from '../accounts/domain/errors/account-not-found.error';
import { ZodValidationPipe } from '../@common/infrastructure/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import type { DecodedToken } from '../auth/domain/services/token-service';
import { CreateTransferUseCase } from './application/use-cases/create-transfer.use-case';
import { DeleteTransferUseCase } from './application/use-cases/delete-transfer.use-case';
import { ListTransfersUseCase } from './application/use-cases/list-transfers.use-case';
import { SameAccountTransferError } from './domain/errors/same-account-transfer.error';
import { TransferNotFoundError } from './domain/errors/transfer-not-found.error';
import {
  createTransferSchema,
  type CreateTransferDto,
} from './dto/create-transfer.dto';
import {
  listTransfersSchema,
  type ListTransfersDto,
} from './dto/list-transfers.dto';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(
    private readonly listTransfers: ListTransfersUseCase,
    private readonly createTransfer: CreateTransferUseCase,
    private readonly deleteTransfer: DeleteTransferUseCase,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: DecodedToken,
    @Query(new ZodValidationPipe(listTransfersSchema)) query: ListTransfersDto,
  ) {
    return this.listTransfers.execute({
      userId: user.sub,
      ...query,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: DecodedToken,
    @Body(new ZodValidationPipe(createTransferSchema)) dto: CreateTransferDto,
  ) {
    try {
      return await this.createTransfer.execute({ userId: user.sub, ...dto });
    } catch (e) {
      if (e instanceof SameAccountTransferError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof AccountNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    try {
      await this.deleteTransfer.execute({ id, userId: user.sub });
    } catch (e) {
      if (e instanceof TransferNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
