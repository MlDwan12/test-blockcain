import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Entity,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userAddress: string;

  @Column()
  tokenAAddress: string;

  @Column()
  tokenBAddress: string;

  @Column('decimal', { precision: 18, scale: 8 })
  amountA: number;

  @Column('decimal', { precision: 18, scale: 8 })
  amountB: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  filledAmount: number;

  @Column()
  type: 'market' | 'limit';

  @Column()
  side: 'buy' | 'sell';

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
