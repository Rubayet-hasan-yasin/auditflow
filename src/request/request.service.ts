import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestItem } from './entities';
import { CreateRequestDto, FulfillItemDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditObjectType } from '../audit/entities';
import { Evidence, EvidenceVersion } from '../evidence/entities';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestItem)
    private readonly requestItemRepository: Repository<RequestItem>,
    @InjectRepository(Evidence)
    private readonly evidenceRepository: Repository<Evidence>,
    @InjectRepository(EvidenceVersion)
    private readonly versionRepository: Repository<EvidenceVersion>,
    private readonly auditService: AuditService,
  ) {}

  async createRequest(
    dto: CreateRequestDto,
    buyerId: string,
    userRole: string,
  ): Promise<Request> {
    // Create request
    const request = this.requestRepository.create({
      buyerId,
      factoryId: dto.factoryId,
      title: dto.title,
      status: 'OPEN',
    });

    const savedRequest = await this.requestRepository.save(request);

    // Create request items
    const items = dto.items.map((item) =>
      this.requestItemRepository.create({
        requestId: savedRequest.id,
        docType: item.docType,
        status: 'PENDING',
      }),
    );

    await this.requestItemRepository.save(items);

    // Log audit
    await this.auditService.log(
      buyerId,
      userRole,
      AuditAction.CREATE_REQUEST,
      AuditObjectType.REQUEST,
      savedRequest.id,
      {
        factoryId: dto.factoryId,
        buyerId,
        title: dto.title,
        itemCount: items.length,
        items: dto.items,
      },
    );

    // Reload with items
    const requestWithItems = await this.requestRepository.findOne({
      where: { id: savedRequest.id },
      relations: ['items'],
    });

    if (!requestWithItems) {
      throw new NotFoundException('Request not found after creation');
    }

    return requestWithItems;
  }

  async getRequestsByFactory(
    factoryId: string,
    userId: string,
    userRole: string,
  ): Promise<Request[]> {
    const requests = await this.requestRepository.find({
      where: { factoryId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    // Log audit
    await this.auditService.log(
      userId,
      userRole,
      AuditAction.VIEW_REQUESTS as string,
      AuditObjectType.REQUEST,
      factoryId,
      {
        factoryId,
        requestCount: requests.length,
      },
    );

    return requests;
  }

  async getRequestsByBuyer(buyerId: string): Promise<Request[]> {
    return this.requestRepository.find({
      where: { buyerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRequestById(requestId: string): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['items'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async fulfillItem(
    requestId: string,
    itemId: string,
    dto: FulfillItemDto,
    factoryId: string,
    userId: string,
    userRole: string,
  ): Promise<{ request: Partial<Request>; item: RequestItem }> {
    // Verify request belongs to factory
    const request = await this.requestRepository.findOne({
      where: { id: requestId, factoryId },
    });

    if (!request) {
      throw new ForbiddenException(
        'Request not found or does not belong to your factory',
      );
    }

    // Verify item exists and belongs to request
    const item = await this.requestItemRepository.findOne({
      where: { id: itemId, requestId },
    });

    if (!item) {
      throw new NotFoundException('Request item not found');
    }

    // Verify evidence belongs to factory
    const evidence = await this.evidenceRepository.findOne({
      where: { id: dto.evidenceId, factoryId },
    });

    if (!evidence) {
      throw new ForbiddenException(
        'Evidence not found or does not belong to your factory',
      );
    }

    // Verify version exists
    const version = await this.versionRepository.findOne({
      where: { id: dto.versionId, evidenceId: dto.evidenceId },
    });

    if (!version) {
      throw new NotFoundException('Evidence version not found');
    }

    // Update item
    const previousStatus = item.status;
    item.evidenceId = dto.evidenceId;
    item.versionId = dto.versionId;
    item.status = 'FULFILLED';

    const updatedItem = await this.requestItemRepository.save(item);

    // Check if all items are fulfilled
    const allItems = await this.requestItemRepository.find({
      where: { requestId },
    });

    const allFulfilled = allItems.every((i) => i.status === 'FULFILLED');

    if (allFulfilled) {
      request.status = 'COMPLETED';
      await this.requestRepository.save(request);
    }

    // Log audit
    await this.auditService.log(
      userId,
      userRole,
      AuditAction.FULFILL_ITEM,
      AuditObjectType.REQUEST_ITEM,
      itemId,
      {
        requestId,
        factoryId,
        docType: item.docType,
        evidenceId: dto.evidenceId,
        versionId: dto.versionId,
        previousStatus,
        newStatus: 'FULFILLED',
      },
    );

    return {
      request: {
        id: request.id,
        status: request.status,
        updatedAt: request.updatedAt,
      },
      item: updatedItem,
    };
  }
}
