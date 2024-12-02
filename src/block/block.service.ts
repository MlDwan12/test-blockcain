import { Injectable } from '@nestjs/common';
import { Order } from './entities/block.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  getQueryMatchOrdersType,
  getQueryOrdersOption,
} from './query-types/query.options.type';
import Web3 from 'web3';

@Injectable()
export class BlockService {
  web3: any;
  contract: any;
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    //уточнить по поводу апишки
    this.web3 = new Web3(process.env.INFURA_URL);
    this.contract = new this.web3.eth.Contract(
      JSON.parse(process.env.CONTRACT_ABI),
      process.env.CONTRACT_ADDRESS,
    );
  }

  /////////////////////////////////////////////////////////////////////////////// это лучше вынести отдельно
  async subscribeToEvents() {
    this.contract.events.OrderCreated({}, (error: any, event: any) => {
      if (error) {
        console.error('ERROR OrderCreated ', error);
      } else {
        console.log('OrderCreated success:');
        this.handleOrderCreated(event);
      }
    });

    this.contract.events.OrderMatched({}, (error: any, event: any) => {
      if (error) {
        console.error('ERROR OrderMatched:', error);
      } else {
        console.log('OrderMatched success:');
        this.handleOrderMatched(event);
      }
    });

    this.contract.events.OrderCancelled({}, (error: any, event: any) => {
      if (error) {
        console.error('ERROR OrderCancelled:', error);
      } else {
        console.log('OrderCancelled success:');
        this.handleOrderCancelled(event);
      }
    });
  }

  async handleOrderCreated(event) {
    const orderData = event.returnValues;
    const order = new Order();
    order.tokenAAddress = orderData.tokenA;
    order.tokenBAddress = orderData.tokenB;
    order.userAddress = orderData.user;
    order.amountA = orderData.amountA;
    order.amountB = orderData.amountB;
    order.active = true;
    await this.orderRepository.save(order);
  }

  async handleOrderMatched(event) {
    const orderId = event.returnValues.orderId;
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (order) {
      order.amountA = event.returnValues.amountA;
      order.amountB = event.returnValues.amountB;

      if (order.amountA === order.amountB) {
        order.active = false;
      }

      await this.orderRepository.save(order);
    }
  }

  async handleOrderCancelled(event) {
    const orderId = event.returnValues.orderId;
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (order) {
      order.active = false;
      await this.orderRepository.save(order);
    }
  }

  async onModuleInit() {
    await this.subscribeToEvents();
  }
  ////////////////////////////////////////////////////////////////

  async getOrders(options: getQueryOrdersOption): Promise<Order[]> {
    return this.orderRepository.find({ where: options });
  }

  async getMatchOrders(options: getQueryMatchOrdersType): Promise<string[]> {
    const orders = await this.orderRepository.find({
      where: {
        tokenAAddress: options.tokenA,
        tokenBAddress: options.tokenB,
        active: true,
      },
    });

    const matchingOrders = orders.filter((order) => {
      if (!options.amountA) {
        return order.amountB >= options.amountB;
      }
      return (
        order.amountA <= options.amountA && order.amountB >= options.amountB
      );
    });

    return matchingOrders.map((order) => order.id);
  }
}
