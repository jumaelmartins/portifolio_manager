import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prismaService: PrismaService) {}

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
            f_images: { select: { id: true, src_path: true } },
          },
        },
        f_projects: {
          select: {
            id: true,
            title: true,
            description: true,
            repo_url: true,
            live_url: true,
            category: { select: { id: true, category: true } },
            technologies: { select: { id: true, tech: true } },
            f_images: { select: { id: true, src_path: true } },
            created_at: true,
            updated_at: true,
          },
        },
        f_education: {
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
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            field_schema: true,
            order: true,
            items: {
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

    return user;
  }
}
