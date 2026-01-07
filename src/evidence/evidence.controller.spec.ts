import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto, AddEvidenceVersionDto } from './dto';

describe('EvidenceController', () => {
  let controller: EvidenceController;
  let service: EvidenceService;

  const mockRequest = {
    user: {
      id: 'user-123',
      factoryId: 'F001',
      role: 'factory',
    },
  };

  const mockEvidenceResponse = {
    evidenceId: 'evidence-123',
    versionId: 'version-1',
  };

  beforeEach(async () => {
    const mockEvidenceService = {
      createEvidence: jest.fn(),
      addVersion: jest.fn(),
      getEvidenceByFactory: jest.fn(),
      getEvidenceById: jest.fn(),
      deleteEvidence: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvidenceController],
      providers: [
        {
          provide: EvidenceService,
          useValue: mockEvidenceService,
        },
      ],
    }).compile();

    controller = module.get<EvidenceController>(EvidenceController);
    service = module.get<EvidenceService>(EvidenceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvidence', () => {
    it('should create evidence', async () => {
      const dto: CreateEvidenceDto = {
        name: 'ISO Certificate',
        docType: 'Certificate',
        expiry: '2026-12-31',
        notes: 'Initial upload',
      };

      jest
        .spyOn(service, 'createEvidence')
        .mockResolvedValue(mockEvidenceResponse);

      const result = await controller.createEvidence(dto, mockRequest);

      expect(result).toEqual(mockEvidenceResponse);
      expect(service.createEvidence).toHaveBeenCalledWith(
        dto,
        'F001',
        'user-123',
        'factory',
      );
    });
  });

  describe('addVersion', () => {
    it('should add version to evidence', async () => {
      const dto: AddEvidenceVersionDto = {
        notes: 'Updated certificate',
        expiry: '2027-12-31',
      };

      const versionResponse = {
        versionId: 'version-2',
        versionNumber: 2,
      };

      jest.spyOn(service, 'addVersion').mockResolvedValue(versionResponse);

      const result = await controller.addVersion('evidence-123', dto, mockRequest);

      expect(result).toEqual(versionResponse);
      expect(service.addVersion).toHaveBeenCalledWith(
        'evidence-123',
        dto,
        'F001',
        'user-123',
        'factory',
      );
    });
  });

  describe('getEvidence', () => {
    it('should get all evidence for factory', async () => {
      const mockEvidenceList = [
        {
          id: 'evidence-123',
          name: 'ISO Certificate',
          docType: 'Certificate',
        },
      ];

      jest
        .spyOn(service, 'getEvidenceByFactory')
        .mockResolvedValue(mockEvidenceList as any);

      const result = await controller.getEvidence(mockRequest);

      expect(result).toEqual(mockEvidenceList);
      expect(service.getEvidenceByFactory).toHaveBeenCalledWith('F001');
    });
  });

  describe('getEvidenceById', () => {
    it('should get evidence by id', async () => {
      const mockEvidence = {
        id: 'evidence-123',
        name: 'ISO Certificate',
        factoryId: 'F001',
      };

      jest
        .spyOn(service, 'getEvidenceById')
        .mockResolvedValue(mockEvidence as any);

      const result = await controller.getEvidenceById('evidence-123', mockRequest);

      expect(result).toEqual(mockEvidence);
      expect(service.getEvidenceById).toHaveBeenCalledWith('evidence-123', 'F001');
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence', async () => {
      jest.spyOn(service, 'deleteEvidence').mockResolvedValue(void 0);

      const result = await controller.deleteEvidence('evidence-123', mockRequest);

      expect(result).toEqual({ message: 'Evidence deleted successfully' });
      expect(service.deleteEvidence).toHaveBeenCalledWith(
        'evidence-123',
        'F001',
        'user-123',
        'factory',
      );
    });
  });
});
