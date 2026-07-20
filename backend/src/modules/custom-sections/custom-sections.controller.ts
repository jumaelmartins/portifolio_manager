import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';
import { CreateCustomSectionDto } from './dto/create-section.dto';
import { CreateCustomItemDto } from './dto/create-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReorderDto } from '../../common/dto/reorder.dto';
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
  findUserSections(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findUserSections(Number(req.user.sub), state);
  }

  @Patch('reorder')
  reorderSections(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.service.reorderSections(Number(req.user.sub), dto.ids);
  }

  // --- item routes (literal-prefixed / deeper paths first) ---

  @Get(':sectionId/items')
  findSectionItems(
    @Param('sectionId') sectionId: string,
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findSectionItems(
      +sectionId,
      Number(req.user.sub),
      Number(req.user.role),
      state,
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

  @Patch(':sectionId/items/reorder')
  reorderItems(
    @Param('sectionId') sectionId: string,
    @Body() dto: ReorderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.reorderItems(
      +sectionId,
      dto.ids,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId/archive')
  archiveItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.archiveItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId/unarchive')
  unarchiveItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.unarchiveItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch('items/:itemId/restore')
  restoreItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.restoreItem(
      +itemId,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete('items/:itemId/purge')
  purgeItem(
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.purgeItem(
      +itemId,
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

  // --- section action routes (before bare :id) ---

  @Patch(':id/archive')
  archiveSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.archiveSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/unarchive')
  unarchiveSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.unarchiveSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/restore')
  restoreSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.restoreSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id/purge')
  purgeSection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.purgeSection(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
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
}
