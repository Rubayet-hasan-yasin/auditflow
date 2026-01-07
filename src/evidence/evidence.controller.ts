import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto, AddEvidenceVersionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @Roles(UserRole.FACTORY)
  async createEvidence(@Body() dto: CreateEvidenceDto, @Request() req) {
    return this.evidenceService.createEvidence(
      dto,
      req.user.factoryId,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':evidenceId/versions')
  @Roles(UserRole.FACTORY)
  async addVersion(
    @Param('evidenceId') evidenceId: string,
    @Body() dto: AddEvidenceVersionDto,
    @Request() req,
  ) {
    return this.evidenceService.addVersion(
      evidenceId,
      dto,
      req.user.factoryId,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  @Roles(UserRole.FACTORY)
  async getEvidence(@Request() req) {
    return this.evidenceService.getEvidenceByFactory(req.user.factoryId);
  }

  @Get(':evidenceId')
  @Roles(UserRole.FACTORY)
  async getEvidenceById(
    @Param('evidenceId') evidenceId: string,
    @Request() req,
  ) {
    return this.evidenceService.getEvidenceById(evidenceId, req.user.factoryId);
  }

  @Delete(':evidenceId')
  @Roles(UserRole.FACTORY)
  async deleteEvidence(
    @Param('evidenceId') evidenceId: string,
    @Request() req,
  ) {
    await this.evidenceService.deleteEvidence(
      evidenceId,
      req.user.factoryId,
      req.user.id,
      req.user.role,
    );
    return { message: 'Evidence deleted successfully' };
  }
}
