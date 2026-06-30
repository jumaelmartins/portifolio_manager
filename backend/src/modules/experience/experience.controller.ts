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
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  create(@Body() dto: CreateExperienceDto, @Req() req: AuthenticatedRequest) {
    return this.experienceService.create(dto, Number(req.user.sub));
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.experienceService.findAll(
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.experienceService.findOne(+id);
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
