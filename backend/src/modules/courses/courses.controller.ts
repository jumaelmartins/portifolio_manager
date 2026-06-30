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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() dto: CreateCourseDto, @Req() req: AuthenticatedRequest) {
    return this.coursesService.create(dto, Number(req.user.sub));
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.coursesService.findAll(
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.coursesService.update(
      +id,
      dto,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.coursesService.remove(
      +id,
      Number(req.user.sub),
      Number(req.user.role),
    );
  }
}
