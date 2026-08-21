import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, f_images } from '@prisma/client';
import { SaveImageDto } from '../dto/save-image.dto';

export const imageWithUsageInclude = {
  f_projects: { select: { id: true, title: true } },
  f_profile_picture: { select: { id: true } },
} satisfies Prisma.f_imagesInclude;

export type ImageWithUsage = Prisma.f_imagesGetPayload<{
  include: typeof imageWithUsageInclude;
}>;

@Injectable()
export class ImagesRepository {
  constructor(private prismaService: PrismaService) {}
  async saveImage(data: SaveImageDto): Promise<f_images> {
    return await this.prismaService.f_images.create({ data });
  }
  async findById(id: number): Promise<f_images | null> {
    return await this.prismaService.f_images.findUnique({ where: { id } });
  }
  async findByUser(id: number): Promise<ImageWithUsage[]> {
    return await this.prismaService.f_images.findMany({
      where: { f_userId: id },
      include: imageWithUsageInclude,
    });
  }
  async delete(id: number): Promise<void> {
    await this.prismaService.f_images.delete({ where: { id } });
  }
  async findWithUsage(id: number): Promise<ImageWithUsage | null> {
    return await this.prismaService.f_images.findUnique({
      where: { id },
      include: imageWithUsageInclude,
    });
  }
}
