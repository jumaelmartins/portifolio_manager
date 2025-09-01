import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { f_images } from '@prisma/client';
import { SaveImageDto } from '../dto/save-image.dto';

@Injectable()
export class ImagesRepository {
  constructor(private prismaService: PrismaService) {}
  async saveImage(data: SaveImageDto): Promise<f_images> {
    return await this.prismaService.f_images.create({ data });
  }
  async findById(id: number): Promise<f_images | null> {
    return await this.prismaService.f_images.findUnique({ where: { id } });
  }
  async findByUser(id: number): Promise<f_images[] | null> {
    return await this.prismaService.f_images.findMany({
      where: { f_userId: id },
    });
  }
  async findAll(): Promise<f_images[] | null> {
    return await this.prismaService.f_images.findMany();
  }
  async delete(id: number): Promise<void> {
    await this.prismaService.f_images.delete({ where: { id } });
  }
}
