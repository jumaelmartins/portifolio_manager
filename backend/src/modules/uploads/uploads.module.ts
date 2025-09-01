import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ImagesService } from '../images/images.service';
import { ImagesRepository } from '../images/repository/images.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  providers: [ImagesService, ImagesRepository, PrismaService],
  controllers: [UploadsController],
})
export class UploadModule {}
