import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { CreateRequestDto, FulfillItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    factoryId?: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post('requests')
  @Roles(UserRole.BUYER)
  async createRequest(
    @Body() dto: CreateRequestDto,
    @Request() req: AuthRequest,
  ) {
    return this.requestService.createRequest(dto, req.user.id, req.user.role);
  }

  @Get('requests')
  @Roles(UserRole.BUYER)
  async getBuyerRequests(@Request() req: AuthRequest) {
    return this.requestService.getRequestsByBuyer(req.user.id);
  }

  @Get('factory/requests')
  @Roles(UserRole.FACTORY)
  async getFactoryRequests(@Request() req: AuthRequest) {
    return this.requestService.getRequestsByFactory(
      req.user.factoryId!,
      req.user.id,
      req.user.role,
    );
  }

  @Get('requests/:requestId')
  async getRequest(@Param('requestId') requestId: string) {
    return this.requestService.getRequestById(requestId);
  }

  @Post('requests/:requestId/items/:itemId/fulfill')
  @Roles(UserRole.FACTORY)
  async fulfillItem(
    @Param('requestId') requestId: string,
    @Param('itemId') itemId: string,
    @Body() dto: FulfillItemDto,
    @Request() req: AuthRequest,
  ) {
    return this.requestService.fulfillItem(
      requestId,
      itemId,
      dto,
      req.user.factoryId!,
      req.user.id,
      req.user.role,
    );
  }
}
