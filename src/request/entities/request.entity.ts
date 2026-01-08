import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RequestItem } from './request-item.entity';

@Entity('request')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  buyerId: string;

  @Column()
  factoryId: string;

  @Column()
  title: string;

  @Column({ default: 'OPEN' })
  status: string; // OPEN | COMPLETED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RequestItem, (item) => item.request, {
    cascade: true,
    eager: true,
  })
  items: RequestItem[];
}
