import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from './request.entity';

@Entity('request_item')
export class RequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requestId: string;

  @Column()
  docType: string;

  @Column({ default: 'PENDING' })
  status: string; // PENDING | FULFILLED

  @Column({ nullable: true })
  evidenceId: string;

  @Column({ nullable: true })
  versionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Request, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requestId' })
  request: Request;
}
