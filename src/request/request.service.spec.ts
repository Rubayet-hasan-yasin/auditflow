import { Test, TestingModule } from '@nestjs/testing';
import { RequestService } from './request.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { Evidence } from '../evidence/entities/evidence.entity';
import { EvidenceVersion } from '../evidence/entities/evidence-version.entity';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('RequestService', () => {
  let service: RequestService;
  let requestRepository: Repository<Request>;
  let requestItemRepository: Repository<RequestItem>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        {
          provide: getRepositoryToken(Request),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RequestItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Evidence),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EvidenceVersion),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    requestRepository = module.get<Repository<Request>>(
      getRepositoryToken(Request),
    );
    requestItemRepository = module.get<Repository<RequestItem>>(
      getRepositoryToken(RequestItem),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('should create a request with items', async () => {
      const dto = {
        factoryId: 'F001',
        title: 'Test Request',
        items: [{ docType: 'Certificate' }],
      };

      const mockRequest = { id: 'req-1', ...dto, buyerId: 'buyer-1', status: 'OPEN' };
      const mockItem = { id: 'item-1', requestId: 'req-1', docType: 'Certificate', status: 'PENDING' };

      jest.spyOn(requestRepository, 'create').mockReturnValue(mockRequest as any);
      jest.spyOn(requestRepository, 'save').mockResolvedValue(mockRequest as any);
      jest.spyOn(requestItemRepository, 'create').mockImplementation((data) => ({ ...data, id: 'item-1' } as any));
      jest.spyOn(requestItemRepository, 'save').mockResolvedValue([mockItem] as any);
      jest.spyOn(requestRepository, 'findOne').mockResolvedValue({ ...mockRequest, items: [mockItem] } as any);

      const result = await service.createRequest(dto, 'buyer-1', 'buyer');

      expect(result.id).toBe('req-1');
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getRequestsByBuyer', () => {
    it('should return requests for a buyer', async () => {
      const mockRequests = [
        { id: 'req-1', buyerId: 'buyer-1', items: [] },
      ];
      jest.spyOn(requestRepository, 'find').mockResolvedValue(mockRequests as any);

      const result = await service.getRequestsByBuyer('buyer-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('getRequestsByFactory', () => {
    it('should return requests for a factory and log audit', async () => {
      const mockRequests = [
        { id: 'req-1', factoryId: 'F001', items: [] },
      ];
      jest.spyOn(requestRepository, 'find').mockResolvedValue(mockRequests as any);

      const result = await service.getRequestsByFactory('F001', 'factory-1', 'factory');

      expect(result).toHaveLength(1);
    });
  });

  describe('fulfillItem', () => {
    it('should throw ForbiddenException if request not found', async () => {
      jest.spyOn(requestRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.fulfillItem('req-1', 'item-1', { evidenceId: 'ev-1', versionId: 'ver-1' }, 'F001', 'factory-1', 'factory'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if item not found', async () => {
      jest.spyOn(requestRepository, 'findOne').mockResolvedValue({ id: 'req-1', factoryId: 'F001' } as any);
      jest.spyOn(requestItemRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.fulfillItem('req-1', 'item-1', { evidenceId: 'ev-1', versionId: 'ver-1' }, 'F001', 'factory-1', 'factory'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
