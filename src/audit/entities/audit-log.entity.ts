import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AuditAction {
  CREATE_EVIDENCE = 'CREATE_EVIDENCE',
  ADD_VERSION = 'ADD_VERSION',
  DELETE_EVIDENCE = 'DELETE_EVIDENCE',
  CREATE_REQUEST = 'CREATE_REQUEST',
  FULFILL_ITEM = 'FULFILL_ITEM',
}

export enum AuditObjectType {
  EVIDENCE = 'Evidence',
  VERSION = 'Version',
  REQUEST = 'Request',
  REQUEST_ITEM = 'RequestItem',
}

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  timestamp: Date;

  @Column()
  actorUserId: string;

  @Column()
  actorRole: string;

  @Column()
  action: string;

  @Column()
  objectType: string;

  @Column()
  objectId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
