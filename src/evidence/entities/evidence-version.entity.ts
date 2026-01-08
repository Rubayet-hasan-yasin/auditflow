import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Evidence } from './evidence.entity';

@Entity('evidence_version')
export class EvidenceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  evidenceId: string;

  @Column()
  version: number;

  @Column({ nullable: true })
  expiry: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Evidence, (evidence) => evidence.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evidenceId' })
  evidence: Evidence;
}
