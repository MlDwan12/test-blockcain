import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { GetMatchOrderOptionsDto } from './dto/query.match-order.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get('getMatchingOrders')
  async getMatchingOrders(
    @Query() options: GetMatchOrderOptionsDto,
  ): Promise<string[]> {
    const { tokenA, tokenB, amountA, amountB } = options;

    const parsedAmountA = amountA ? parseFloat(amountA) : undefined;
    const parsedAmountB = amountB ? parseFloat(amountB) : undefined;

    return this.blockService.getMatchOrders({
      tokenA,
      tokenB,
      amountA: parsedAmountA,
      amountB: parsedAmountB,
    });
  }
}
