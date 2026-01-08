import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { Request, RequestItem } from './entities';
import { AuditModule } from '../audit/audit.module';
import { Evidence, EvidenceVersion } from '../evidence/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, RequestItem, Evidence, EvidenceVersion]),
    AuditModule,
  ],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
