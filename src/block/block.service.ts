import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Web3 from 'web3';
import { Order } from './entities/block.entity';
import { GetOrderOptionsDto } from './dto/query.get-order.dto';
import { GetMatchOrderOptionsDto } from './dto/query.match-order.dto';

@Injectable()
export class BlockService implements OnModuleInit {
  private readonly web3: Web3;
  private readonly contracts: any[];

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
  ) {
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////// по хорошему вынести в отдельный модуль

    const rpcUrl = this.configService.get<string>('RPC_URL');

    this.web3 = new Web3(rpcUrl);

    const contractData = [
      {
        abi: this.configService.get<string>('CONTRACT_ABI_1'),
        address: this.configService.get<string>('CONTRACT_ADDRESS_TOKEN_1'),
      },
      {
        abi: this.configService.get<string>('CONTRACT_ABI_2'),
        address: this.configService.get<string>('CONTRACT_ADDRESS_TOKEN_2'),
      },
    ];

    this.contracts = contractData
      .filter(({ abi, address }) => abi && address)
      .map(
        ({ abi, address }) =>
          new this.web3.eth.Contract(JSON.parse(abi), address),
      );

    if (this.contracts.length === 0) {
      throw new Error('No valid contracts found in the configuration.');
    }
  }

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    this.contracts.forEach((contract, index) => {
      contract.events
        .OrderCreated({}, (error, event) =>
          this.handleEvent(
            error,
            event,
            'OrderCreated',
            this.handleOrderCreated,
          ),
        )
        .on('connected', () => console.log(`Connected to OrderCreated`))
        .on('error', (err: any) => console.error(`Error OrderCreated`, err));

      contract.events
        .OrderMatched({}, (error, event) =>
          this.handleEvent(
            error,
            event,
            'OrderMatched',
            this.handleOrderMatched,
          ),
        )
        .on('connected', () => console.log(`Connected to OrderMatched`))
        .on('error', (err: any) => console.error(`Error OrderMatched`, err));

      contract.events
        .OrderCancelled({}, (error, event) =>
          this.handleEvent(
            error,
            event,
            'OrderCancelled',
            this.handleOrderCancelled,
          ),
        )
        .on('connected', () => console.log(`Connected to OrderCancelled`))
        .on('error', (err: any) => console.error(`Error OrderCancelled`, err));
    });
  }

  private async handleEvent(
    error: any,
    event: any,
    eventName: string,
    handler: (event: any) => Promise<void>,
  ) {
    if (error) {
      console.error(`Error processing ${eventName}:`, error);
      return;
    }

    try {
      await handler(event);
      console.log(`${eventName} processed successfully:`, event);
    } catch (err) {
      console.error(err);
    }
  }

  private async handleOrderCreated(event: any) {
    const { tokenA, tokenB, user, amountA, amountB } = event.returnValues;
    const order = new Order();
    order.tokenAAddress = tokenA;
    order.tokenBAddress = tokenB;
    order.userAddress = user;
    order.amountA = amountA;
    order.amountB = amountB;
    order.active = true;
    await this.orderRepository.save(order);
  }

  private async handleOrderMatched(event: any) {
    const { orderId, amountA, amountB } = event.returnValues;
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (order) {
      order.amountA = amountA;
      order.amountB = amountB;

      if (Number(amountA) === Number(amountB)) {
        order.active = false;
      }

      await this.orderRepository.save(order);
    }
  }

  private async handleOrderCancelled(event: any) {
    const { orderId } = event.returnValues;
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (order) {
      order.active = false;
      await this.orderRepository.save(order);
    }
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async getOrders(options: GetOrderOptionsDto): Promise<Order[]> {
    return this.orderRepository.find({ where: options });
  }

  async getMatchOrders(options: GetMatchOrderOptionsDto): Promise<string[]> {
    const orders = await this.orderRepository.find({
      where: {
        tokenAAddress: options.tokenA,
        tokenBAddress: options.tokenB,
        active: true,
      },
    });

    const amountA = Number(options.amountA);
    const amountB = Number(options.amountB);

    const matchingOrders = orders.filter((order) => {
      if (!options.amountA) {
        return order.amountB >= amountB;
      }
      return order.amountA <= amountA && order.amountB >= amountB;
    });

    return matchingOrders.map((order) => order.id);
  }
}
