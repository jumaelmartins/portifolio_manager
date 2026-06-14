import type { f_images } from '@prisma/client';
import { basename } from 'path';

export function presentImage(image: f_images, publicBaseUrl: string) {
  const fileName = basename(image.src_path.replaceAll('\\', '/'));

  return {
    id: image.id,
    description: image.description,
    url: new URL(
      `/uploads/${image.f_userId}/${fileName}`,
      publicBaseUrl,
    ).toString(),
    created_at: image.created_at,
    updated_at: image.updated_at,
  };
}
