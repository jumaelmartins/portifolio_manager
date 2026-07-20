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
  Query,
} from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';
import { ReorderDto } from '../../common/dto/reorder.dto';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  create(@Body() dto: CreateExperienceDto, @Req() req: AuthenticatedRequest) {
    return this.experienceService.create(dto, Number(req.user.sub));
  }

  @Get()
  findAll(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.experienceService.findAll(
      Number(req.user.sub),
      Number(req.user.role),
      state,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.experienceService.findOne(+id);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.experienceService.reorder(Number(req.user.sub), dto.ids);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.archive(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.unarchive(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.restore(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id/purge')
  purge(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.purge(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.experienceService.update(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.experienceService.remove(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
}
