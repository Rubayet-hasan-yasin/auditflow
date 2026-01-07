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
  versionNumber: number;

  @Column()
  notes: string;

  @Column()
  expiry: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Evidence, (evidence) => evidence.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evidenceId' })
  evidence: Evidence;
}
