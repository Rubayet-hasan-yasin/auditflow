import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evidence, EvidenceVersion } from './entities';
import { CreateEvidenceDto, AddEvidenceVersionDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditObjectType } from '../audit/entities';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepository: Repository<Evidence>,
    @InjectRepository(EvidenceVersion)
    private readonly versionRepository: Repository<EvidenceVersion>,
    private readonly auditService: AuditService,
  ) {}

  async createEvidence(
    dto: CreateEvidenceDto,
    factoryId: string,
    userId: string,
    userRole: string,
  ): Promise<{ evidenceId: string; versionId: string }> {
    // Create evidence
    const evidence = this.evidenceRepository.create({
      name: dto.name,
      docType: dto.docType,
      expiry: dto.expiry,
      notes: dto.notes || '',
      factoryId,
    });

    const savedEvidence = await this.evidenceRepository.save(evidence);

    // Create initial version (v1)
    const version = this.versionRepository.create({
      evidenceId: savedEvidence.id,
      versionNumber: 1,
      notes: dto.notes || '',
      expiry: dto.expiry,
    });

    const savedVersion = await this.versionRepository.save(version);

    // Log audit
    await this.auditService.log(
      userId,
      userRole,
      AuditAction.CREATE_EVIDENCE,
      AuditObjectType.EVIDENCE,
      savedEvidence.id,
      {
        factoryId,
        name: dto.name,
        docType: dto.docType,
        expiry: dto.expiry,
        initialVersionId: savedVersion.id,
      },
    );

    return {
      evidenceId: savedEvidence.id,
      versionId: savedVersion.id,
    };
  }

  async addVersion(
    evidenceId: string,
    dto: AddEvidenceVersionDto,
    factoryId: string,
    userId: string,
    userRole: string,
  ): Promise<{ versionId: string; versionNumber: number }> {
    // Verify evidence exists and belongs to factory
    const evidence = await this.evidenceRepository.findOne({
      where: { id: evidenceId, factoryId },
    });

    if (!evidence) {
      throw new ForbiddenException(
        'Evidence not found or does not belong to your factory',
      );
    }

    // Get latest version number
    const latestVersion = await this.versionRepository.findOne({
      where: { evidenceId },
      order: { versionNumber: 'DESC' },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version
    const newVersion = this.versionRepository.create({
      evidenceId,
      versionNumber: nextVersionNumber,
      notes: dto.notes,
      expiry: dto.expiry,
    });

    const savedVersion = await this.versionRepository.save(newVersion);

    // Log audit
    await this.auditService.log(
      userId,
      userRole,
      AuditAction.ADD_VERSION,
      AuditObjectType.VERSION,
      savedVersion.id,
      {
        evidenceId,
        factoryId,
        versionNumber: nextVersionNumber,
        notes: dto.notes,
        expiry: dto.expiry,
      },
    );

    return {
      versionId: savedVersion.id,
      versionNumber: nextVersionNumber,
    };
  }

  async getEvidenceByFactory(factoryId: string): Promise<Evidence[]> {
    return this.evidenceRepository.find({
      where: { factoryId },
      relations: ['versions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEvidenceById(
    evidenceId: string,
    factoryId: string,
  ): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({
      where: { id: evidenceId, factoryId },
      relations: ['versions'],
    });

    if (!evidence) {
      throw new ForbiddenException(
        'Evidence not found or does not belong to your factory',
      );
    }

    return evidence;
  }

  async deleteEvidence(
    evidenceId: string,
    factoryId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const evidence = await this.evidenceRepository.findOne({
      where: { id: evidenceId, factoryId },
    });

    if (!evidence) {
      throw new ForbiddenException(
        'Evidence not found or does not belong to your factory',
      );
    }

    await this.evidenceRepository.remove(evidence);

    // Log audit
    await this.auditService.log(
      userId,
      userRole,
      AuditAction.DELETE_EVIDENCE,
      AuditObjectType.EVIDENCE,
      evidenceId,
      { factoryId },
    );
  }
}
