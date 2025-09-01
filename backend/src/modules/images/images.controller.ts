import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.imagesService.findOne(+id);
  }
  @Get()
  async findAll() {
    return await this.imagesService.findAll();
  }
  @Get('/user/:id')
  async findByUser(@Param('id') id: string) {
    return await this.imagesService.findByUser(+id);
  }
}
