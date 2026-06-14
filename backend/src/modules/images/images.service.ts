import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { f_images } from '@prisma/client';
import { SaveImageDto } from './dto/save-image.dto';
import { ImagesRepository } from './repository/images.repository';
import { presentImage } from '../../common/presenters/image.presenter';

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
    return images.map((image) => this.present(image));
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
    const image = await this.imagesRepository.findById(id);

    if (!image) {
      throw new ForbiddenException('Image does not exist');
    }

    try {
      const fs = await import('fs/promises');
      await fs.unlink(image.src_path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('file already deleted:', message);
    }
    await this.imagesRepository.delete(id);
    return {
      message: 'successfull deleted image!',
    };
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
