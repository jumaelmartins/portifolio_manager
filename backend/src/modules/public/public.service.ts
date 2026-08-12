import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { f_images } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { presentImage } from '../../common/presenters/image.presenter';

const IMAGE_SELECT = {
  id: true,
  description: true,
  src_path: true,
  f_userId: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class PublicService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async getPortfolio(userId: number) {
    const user = await this.prismaService.f_user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: { select: { id: true, role: true } },
        status: { select: { id: true, status: true } },
        f_profile_picture: {
          select: {
            id: true,
            f_images: { select: IMAGE_SELECT },
          },
        },
        f_projects: {
          where: { archived_at: null, deleted_at: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            repo_url: true,
            live_url: true,
            category: { select: { id: true, category: true } },
            technologies: { select: { id: true, tech: true } },
            f_images: { select: IMAGE_SELECT },
            created_at: true,
            updated_at: true,
          },
        },
        f_education: {
          where: { archived_at: null, deleted_at: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            institution_name: true,
            description: true,
            start_date: true,
            end_date: true,
            created_at: true,
            updated_at: true,
          },
        },
        f_courses: {
          where: { archived_at: null, deleted_at: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            institution_name: true,
            description: true,
            start_date: true,
            end_date: true,
            created_at: true,
            updated_at: true,
          },
        },
        f_experience: {
          where: { archived_at: null, deleted_at: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            tile: true,
            company_name: true,
            description: true,
            start_date: true,
            end_date: true,
            created_at: true,
            updated_at: true,
          },
        },
        custom_sections: {
          where: { archived_at: null, deleted_at: null },
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            field_schema: true,
            order: true,
            items: {
              where: { archived_at: null, deleted_at: null },
              select: {
                id: true,
                data: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return {
      ...user,
      f_profile_picture: user.f_profile_picture && {
        ...user.f_profile_picture,
        f_images: this.presentImageOrNull(user.f_profile_picture.f_images),
      },
      f_projects: user.f_projects.map((project) => ({
        ...project,
        f_images: this.presentImageOrNull(project.f_images),
      })),
    };
  }

  private presentImageOrNull(image: f_images | null) {
    if (!image) {
      return null;
    }

    return presentImage(
      image,
      this.configService.get<string>(
        'BACKEND_PUBLIC_URL',
        'http://localhost:3000',
      ),
    );
  }
}
