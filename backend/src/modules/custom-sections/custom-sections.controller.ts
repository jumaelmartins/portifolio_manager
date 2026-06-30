import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';
import { CreateCustomSectionDto } from './dto/create-section.dto';
import { CreateCustomItemDto } from './dto/create-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('custom-sections')
export class CustomSectionsController {
  constructor(private readonly service: CustomSectionsService) {}

  @Post()
  createSection(
    @Body() dto: CreateCustomSectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createSection(Number(req.user.sub), dto);
  }

  @Get()
  findUserSections(@Req() req: AuthenticatedRequest) {
    return this.service.findUserSections(Number(req.user.sub));
  }

  @Patch(':id')
  updateSection(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCustomSectionDto>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateSection(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id')
  deleteSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.deleteSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Post(':id/items')
  createItem(
    @Param('id') id: string,
    @Body() dto: CreateCustomItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createItem(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: Partial<CreateCustomItemDto>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateItem(
      +itemId,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete('items/:itemId')
  deleteItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
}
