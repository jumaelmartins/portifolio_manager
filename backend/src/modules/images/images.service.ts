import { ForbiddenException, Injectable } from '@nestjs/common';
import { SaveImageDto } from './dto/save-image.dto';
import { ImagesRepository } from './repository/images.repository';
import { f_images } from '@prisma/client';

@Injectable()
export class ImagesService {
  constructor(private imagesRepository: ImagesRepository) {}
  async saveImage(data: SaveImageDto): Promise<f_images> {
    return await this.imagesRepository.saveImage(data);
  }
  async findAll(): Promise<f_images[] | null> {
    return await this.imagesRepository.findAll();
  }
  async findByUser(id: number): Promise<f_images[] | null> {
    return await this.imagesRepository.findByUser(id);
  }
  async findOne(id: number): Promise<f_images | null> {
    return await this.imagesRepository.findById(id);
  }
  async delete(id: number) {
    const image = await this.imagesRepository.findById(id);

    if (!image) {
      throw new ForbiddenException('Image does not exist');
    }

    try {
      const fs = await import('fs/promises');
      await fs.unlink(image.src_path);
    } catch (err) {
      console.warn('file already deleted:', err.message);
    }
    await this.imagesRepository.delete(id);
    return {
      message: 'successfull deleted image!',
    };
  }
}
