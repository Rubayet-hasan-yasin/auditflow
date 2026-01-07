import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditObjectType } from './entities';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    actorUserId: string,
    actorRole: string,
    action: AuditAction | string,
    objectType: AuditObjectType | string,
    objectId: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    const auditLog = this.auditRepository.create({
      timestamp: new Date(),
      actorUserId,
      actorRole,
      action,
      objectType,
      objectId,
      metadata: metadata || {},
    });
    return this.auditRepository.save(auditLog);
  }

  async getLogs(filters?: {
    action?: string;
    objectType?: string;
    actorUserId?: string;
  }): Promise<AuditLog[]> {
    let query = this.auditRepository.createQueryBuilder('audit');

    if (filters?.action) {
      query = query.where('audit.action = :action', { action: filters.action });
    }
    if (filters?.objectType) {
      query = query.andWhere('audit.objectType = :objectType', {
        objectType: filters.objectType,
      });
    }
    if (filters?.actorUserId) {
      query = query.andWhere('audit.actorUserId = :actorUserId', {
        actorUserId: filters.actorUserId,
      });
    }

    return query.orderBy('audit.timestamp', 'DESC').getMany();
  }
}
