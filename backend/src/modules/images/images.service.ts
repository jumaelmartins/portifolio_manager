import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { f_images } from '@prisma/client';
import { unlink } from 'fs/promises';
import { SaveImageDto } from './dto/save-image.dto';
import { ImagesRepository } from './repository/images.repository';
import {
  presentImage,
  presentImageWithUsage,
} from '../../common/presenters/image.presenter';

@Injectable()
export class ImagesService {
  constructor(
    private imagesRepository: ImagesRepository,
    private configService: ConfigService,
  ) {}

  async saveImage(data: SaveImageDto) {
    const image = await this.imagesRepository.saveImage(data);
    return this.present(image);
  }

  async findByUser(id: number) {
    const images = await this.imagesRepository.findByUser(id);
    const baseUrl = this.configService.get<string>(
      'BACKEND_PUBLIC_URL',
      'http://localhost:3000',
    );
    return images.map((image) => presentImageWithUsage(image, baseUrl));
  }

  async findOwned(id: number, userId: number) {
    const image = await this.imagesRepository.findById(id);
    if (!image || image.f_userId !== userId) {
      throw new NotFoundException('Image not found');
    }

    return this.present(image);
  }

  findEntity(id: number) {
    return this.imagesRepository.findById(id);
  }

  async delete(id: number) {
    const image = await this.imagesRepository.findWithUsage(id);
    if (!image) {
      throw new ForbiddenException('Image does not exist');
    }

    const projectCount = image.f_projects.length;
    const isProfilePicture = image.f_profile_picture !== null;
    if (projectCount > 0 || isProfilePicture) {
      const parts: string[] = [];
      if (projectCount > 0) parts.push(`${projectCount} project(s)`);
      if (isProfilePicture) parts.push('the profile picture');
      throw new ConflictException(`Image is in use by ${parts.join(' and ')}`);
    }

    await this.imagesRepository.delete(id);
    try {
      await unlink(image.src_path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('file already deleted:', message);
    }
    return { message: 'successfull deleted image!' };
  }

  async updateDescription(
    id: number,
    userId: number,
    description: string | null,
  ) {
    const image = await this.imagesRepository.findById(id);
    if (!image || image.f_userId !== userId) {
      throw new NotFoundException('Image not found');
    }
    const updated = await this.imagesRepository.updateDescription(
      id,
      description ?? null,
    );
    return this.present(updated);
  }

  private present(image: f_images) {
    return presentImage(
      image,
      this.configService.get<string>(
        'BACKEND_PUBLIC_URL',
        'http://localhost:3000',
      ),
    );
  }
}
