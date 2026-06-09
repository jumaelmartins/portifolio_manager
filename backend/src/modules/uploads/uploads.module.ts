import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ImagesService } from '../images/images.service';
import { ImagesRepository } from '../images/repository/images.repository';
@Module({
  providers: [ImagesService, ImagesRepository],
  controllers: [UploadsController],
})
export class UploadModule {}
