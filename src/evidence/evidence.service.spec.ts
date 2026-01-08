import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceService } from './evidence.service';
import { AuditService } from '../audit/audit.service';
import { Evidence, EvidenceVersion } from './entities';
import { CreateEvidenceDto, AddEvidenceVersionDto } from './dto';
import { ForbiddenException } from '@nestjs/common';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let evidenceRepository: Repository<Evidence>;
  let versionRepository: Repository<EvidenceVersion>;
  let auditService: AuditService;

  const mockEvidence: Evidence = {
    id: 'evidence-123',
    factoryId: 'F001',
    name: 'ISO Certificate',
    docType: 'Certificate',
    expiry: '2026-12-31',
    notes: 'Initial upload',
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [],
  };

  const mockVersion: EvidenceVersion = {
    id: 'version-1',
    evidenceId: 'evidence-123',
    version: 1,
    notes: 'Initial',
    expiry: '2026-12-31',
    createdAt: new Date(),
    evidence: mockEvidence,
  };

  beforeEach(async () => {
    const mockEvidenceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockVersionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: getRepositoryToken(Evidence),
          useValue: mockEvidenceRepository,
        },
        {
          provide: getRepositoryToken(EvidenceVersion),
          useValue: mockVersionRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
    evidenceRepository = module.get(getRepositoryToken(Evidence));
    versionRepository = module.get(getRepositoryToken(EvidenceVersion));
    auditService = module.get<AuditService>(AuditService);
  });

  describe('createEvidence', () => {
    it('should create evidence with initial version', async () => {
      const dto: CreateEvidenceDto = {
        name: 'ISO Certificate',
        docType: 'Certificate',
        expiry: '2026-12-31',
        notes: 'Initial upload',
      };

      jest.spyOn(evidenceRepository, 'create').mockReturnValue(mockEvidence);
      jest
        .spyOn(evidenceRepository, 'save')
        .mockResolvedValue(mockEvidence);
      jest.spyOn(versionRepository, 'create').mockReturnValue(mockVersion);
      jest
        .spyOn(versionRepository, 'save')
        .mockResolvedValue(mockVersion);
      jest.spyOn(auditService, 'log').mockResolvedValue(null);

      const result = await service.createEvidence(
        dto,
        'F001',
        'user-123',
        'factory',
      );

      expect(result.evidenceId).toBe('evidence-123');
      expect(result.versionId).toBe('version-1');
      expect(auditService.log).toHaveBeenCalledWith(
        'user-123',
        'factory',
        'CREATE_EVIDENCE',
        'Evidence',
        'evidence-123',
        expect.objectContaining({
          factoryId: 'F001',
          name: dto.name,
        }),
      );
    });

    it('should handle missing notes field', async () => {
      const dto: CreateEvidenceDto = {
        name: 'ISO Certificate',
        docType: 'Certificate',
        expiry: '2026-12-31',
      };

      jest.spyOn(evidenceRepository, 'create').mockReturnValue(mockEvidence);
      jest
        .spyOn(evidenceRepository, 'save')
        .mockResolvedValue(mockEvidence);
      jest.spyOn(versionRepository, 'create').mockReturnValue(mockVersion);
      jest
        .spyOn(versionRepository, 'save')
        .mockResolvedValue(mockVersion);
      jest.spyOn(auditService, 'log').mockResolvedValue(null);

      const result = await service.createEvidence(
        dto,
        'F001',
        'user-123',
        'factory',
      );

      expect(result).toBeDefined();
    });
  });

  describe('addVersion', () => {
    it('should add new version to existing evidence', async () => {
      const dto: AddEvidenceVersionDto = {
        notes: 'Updated certificate',
        expiry: '2027-12-31',
      };

      const newVersion: EvidenceVersion = {
        ...mockVersion,
        id: 'version-2',
        version: 2,
        notes: dto.notes,
      };

      jest
        .spyOn(evidenceRepository, 'findOne')
        .mockResolvedValue(mockEvidence);
      jest
        .spyOn(versionRepository, 'findOne')
        .mockResolvedValue(mockVersion);
      jest.spyOn(versionRepository, 'create').mockReturnValue(newVersion);
      jest.spyOn(versionRepository, 'save').mockResolvedValue(newVersion);
      jest.spyOn(auditService, 'log').mockResolvedValue(null);

      const result = await service.addVersion(
        'evidence-123',
        dto,
        'F001',
        'user-123',
        'factory',
      );

      expect(result.versionNumber).toBe(2);
      expect(result.versionId).toBe('version-2');
      expect(auditService.log).toHaveBeenCalledWith(
        'user-123',
        'factory',
        'ADD_VERSION',
        'Version',
        'version-2',
        expect.objectContaining({
          versionNumber: 2,
          evidenceId: 'evidence-123',
        }),
      );
    });

    it('should throw ForbiddenException for evidence not belonging to factory', async () => {
      const dto: AddEvidenceVersionDto = {
        notes: 'Updated certificate',
        expiry: '2027-12-31',
      };

      jest.spyOn(evidenceRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.addVersion('evidence-123', dto, 'F002', 'user-123', 'factory'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEvidenceByFactory', () => {
    it('should return all evidence for factory', async () => {
      const evidenceList = [mockEvidence];

      jest.spyOn(evidenceRepository, 'find').mockResolvedValue(evidenceList);

      const result = await service.getEvidenceByFactory('F001');

      expect(result).toEqual(evidenceList);
      expect(evidenceRepository.find).toHaveBeenCalledWith({
        where: { factoryId: 'F001' },
        relations: ['versions'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getEvidenceById', () => {
    it('should return evidence by id', async () => {
      jest
        .spyOn(evidenceRepository, 'findOne')
        .mockResolvedValue(mockEvidence);

      const result = await service.getEvidenceById('evidence-123', 'F001');

      expect(result).toEqual(mockEvidence);
    });

    it('should throw ForbiddenException for wrong factory', async () => {
      jest.spyOn(evidenceRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getEvidenceById('evidence-123', 'F002'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence and log audit', async () => {
      jest
        .spyOn(evidenceRepository, 'findOne')
        .mockResolvedValue(mockEvidence);
      jest.spyOn(evidenceRepository, 'remove').mockResolvedValue(null);
      jest.spyOn(auditService, 'log').mockResolvedValue(null);

      await service.deleteEvidence(
        'evidence-123',
        'F001',
        'user-123',
        'factory',
      );

      expect(evidenceRepository.remove).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'user-123',
        'factory',
        'DELETE_EVIDENCE',
        'Evidence',
        'evidence-123',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException for wrong factory', async () => {
      jest.spyOn(evidenceRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.deleteEvidence('evidence-123', 'F002', 'user-123', 'factory'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
