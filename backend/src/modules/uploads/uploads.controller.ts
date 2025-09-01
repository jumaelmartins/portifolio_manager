import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ImagesService } from '../images/images.service';
import { existsSync, mkdirSync } from 'fs';

@Controller('upload')
export class UploadsController {
  constructor(private imagesService: ImagesService) {}

  @Post('users/:userId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        // Define onde o arquivo será salvo
        destination: (req, file, callback) => {
          const userId = req.params.userId;
          const uploadPath = join(process.cwd(), 'uploads', userId);

          // Cria a pasta se não existir
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        // Define o nome do arquivo salvo
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      // Filtro para aceitar só imagens
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Apenas imagens são permitidas!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Salva registro no banco
    const saved = await this.imagesService.saveImage({
      f_userId: userId,
      src_path: file.path,
    });

    return {
      message: 'Successfully upload!',
      image: saved,
    };
  }

  @Delete(':imageId')
  async deleteImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.imagesService.delete(imageId);
  }
}
