import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImagesService } from '../images/images.service';
import { UserRoles, type AuthenticatedRequest } from '../../utils/types';

export function canManageUploadTarget(
  user: AuthenticatedRequest['user'] | undefined,
  userId: number,
) {
  return Boolean(
    user &&
      Number.isInteger(userId) &&
      (Number(user.sub) === userId || user.role === String(UserRoles.SYSADMIN)),
  );
}

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('upload')
export class UploadsController {
  constructor(private imagesService: ImagesService) {}

  @Post('users/:userId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, callback) => {
          const userId = Number(req.params.userId);
          const user = (req as AuthenticatedRequest).user;
          if (!canManageUploadTarget(user, userId)) {
            callback(
              new ForbiddenException(
                'You can only upload images to your own account.',
              ),
              '',
            );
            return;
          }

          const uploadPath = join(process.cwd(), 'uploads', String(userId));

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only images are allowed.'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!canManageUploadTarget(req.user, userId)) {
      throw new ForbiddenException(
        'You can only upload images to your own account.',
      );
    }

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const saved = await this.imagesService.saveImage({
      f_userId: userId,
      src_path: join('uploads', String(userId), file.filename),
    });

    return {
      message: 'Successfully upload!',
      image: saved,
    };
  }

  @Delete(':imageId')
  async deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const { sub, role } = req.user;
    const isSysadmin = role === String(UserRoles.SYSADMIN);
    const image = await this.imagesService.findEntity(imageId);
    if (!image) {
      throw new ForbiddenException('Image not found.');
    }

    if (Number(sub) !== image.f_userId && !isSysadmin) {
      throw new ForbiddenException(
        'You can only delete images from your own account.',
      );
    }

    return this.imagesService.delete(imageId);
  }
}
