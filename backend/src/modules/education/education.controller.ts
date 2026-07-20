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
import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';
import { ReorderDto } from '../../common/dto/reorder.dto';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Post()
  create(@Body() dto: CreateEducationDto, @Req() req: AuthenticatedRequest) {
    return this.educationService.create(dto, Number(req.user.sub));
  }

  @Get()
  findAll(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.educationService.findAll(
      Number(req.user.sub),
      Number(req.user.role),
      state,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationService.findOne(+id);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.educationService.reorder(Number(req.user.sub), dto.ids);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.educationService.archive(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.educationService.unarchive(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.educationService.restore(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id/purge')
  purge(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.educationService.purge(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.educationService.update(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.educationService.remove(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
}
