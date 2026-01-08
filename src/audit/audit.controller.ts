import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('objectType') objectType?: string,
    @Query('actorUserId') actorUserId?: string,
  ) {
    return this.auditService.getLogs({
      action,
      objectType,
      actorUserId,
    });
  }
}
