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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

function parseFeatured(value: string | undefined): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiCreatedResponse({ description: 'The created project' })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.create(createProjectDto, Number(req.user.sub));
  }

  @Get()
  @ApiOperation({
    summary: 'List the projects owned by the authenticated user',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    enum: ['active', 'archived', 'trashed'],
    description: 'Filter by content state (defaults to active)',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    schema: { type: 'boolean' },
    description:
      'When set, returns only featured (true) or non-featured (false)',
  })
  @ApiOkResponse({ description: 'The matching projects' })
  findAll(
    @Query('state') state: string | undefined,
    @Query('featured') featured: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findAll(
      Number(req.user.sub),
      state,
      parseFeatured(featured),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project by id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findOne(id, Number(req.user.sub));
  }

  @Patch('reorder')
  @ApiOperation({
    summary: 'Reorder projects',
    description: 'Persists the manual order from the full list of owned ids.',
  })
  reorder(@Body() dto: ReorderDto, @Req() req: AuthenticatedRequest) {
    return this.projectsService.reorder(Number(req.user.sub), dto.ids);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a project' })
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.archive(id, Number(req.user.sub));
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive a project' })
  unarchive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.unarchive(id, Number(req.user.sub));
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a trashed project' })
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.restore(id, Number(req.user.sub));
  }

  @Delete(':id/purge')
  @ApiOperation({
    summary: 'Permanently delete a trashed project',
    description: 'Only projects already in the trash can be purged.',
  })
  purge(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.purge(id, Number(req.user.sub));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project',
    description: 'Partial update; also used to toggle the featured flag.',
  })
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
  @ApiOperation({
    summary: 'Trash a project (soft delete)',
    description: 'Moves the project to the trash; use purge to remove it.',
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.delete(id, Number(req.user.sub));
  }
}
