import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ReorderDto } from '../../common/dto/reorder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.create(createProjectDto, Number(req.user.sub));
  }

  @Get()
  findAll(
    @Query('state') state: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findAll(Number(req.user.sub), state);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findOne(id, Number(req.user.sub));
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.projectsService.reorder(Number(req.user.sub), dto.ids);
  }

  @Patch(':id/archive')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.archive(id, Number(req.user.sub));
  }

  @Patch(':id/unarchive')
  unarchive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.unarchive(id, Number(req.user.sub));
  }

  @Patch(':id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.restore(id, Number(req.user.sub));
  }

  @Delete(':id/purge')
  purge(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.purge(id, Number(req.user.sub));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.update(
      id,
      updateProjectDto,
      Number(req.user.sub),
    );
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.delete(id, Number(req.user.sub));
  }
}
