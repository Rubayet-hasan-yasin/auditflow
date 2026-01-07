import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EvidenceVersion } from './evidence-version.entity';

@Entity('evidence')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  factoryId: string;

  @Column()
  name: string;

  @Column()
  docType: string;

  @Column()
  expiry: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => EvidenceVersion, (version) => version.evidence, {
    cascade: true,
    eager: true,
  })
  versions: EvidenceVersion[];
}
