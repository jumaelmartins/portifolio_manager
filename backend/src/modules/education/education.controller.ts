import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from "@nestjs/common";
import { EducationService } from "./education.service";
import { CreateEducationDto } from "./dto/create-education.dto";
import { UpdateEducationDto } from "./dto/update-education.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ActiveUserGuard } from "../auth/guards/active-user.guard";
import type { AuthenticatedRequest } from "../../utils/types";

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller("education")
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Post()
  create(@Body() dto: CreateEducationDto, @Req() req: AuthenticatedRequest) {
    return this.educationService.create(dto, Number(req.user.sub));
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.educationService.findAll(Number(req.user.sub), Number(req.user.role));
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.educationService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateEducationDto, @Req() req: AuthenticatedRequest) {
    return this.educationService.update(+id, dto, Number(req.user.sub), Number(req.user.role));
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.educationService.remove(+id, Number(req.user.sub), Number(req.user.role));
  }
}
