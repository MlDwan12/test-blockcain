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
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetOrderOptionsDto } from './dto/query.get-order.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get('getMatchingOrders')
  @ApiQuery({ name: 'tokenA', required: false, description: 'Адрес токена A' })
  @ApiQuery({ name: 'tokenB', required: false, description: 'Адрес токена B' })
  @ApiQuery({ name: 'amountA', required: false, description: 'Сумма токена A' })
  @ApiQuery({ name: 'amountB', required: false, description: 'Сумма токена B' })
  @ApiResponse({
    status: 200,
    description: 'Список id совпадающих заявок',
    example: ['6df418f6-a49e-493d-834c-18cced2f603e'],
  })
  async getMatchingOrders(
    @Query() options: GetMatchOrderOptionsDto,
  ): Promise<string[]> {
    const { tokenA, tokenB, amountA, amountB } = options;

    return this.blockService.getMatchOrders({
      tokenA,
      tokenB,
      amountA,
      amountB,
    });
  }

  @Get('orders')
  @ApiQuery({ name: 'tokenA', required: false, description: 'Адрес токена A' })
  @ApiQuery({ name: 'tokenB', required: false, description: 'Адрес токена B' })
  @ApiQuery({
    name: 'user',
    required: false,
    description: 'Адрес пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Список заявок',
  })
  async getOrders(@Query() query: GetOrderOptionsDto) {
    return this.blockService.getOrders(query);
  }
}
