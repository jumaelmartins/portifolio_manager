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

type ImageWithUsageInput = f_images & {
  f_projects: { id: number; title: string }[];
  f_profile_picture: { id: number } | null;
};

export function presentImageWithUsage(
  image: ImageWithUsageInput,
  publicBaseUrl: string,
) {
  return {
    ...presentImage(image, publicBaseUrl),
    usage: {
      projects: image.f_projects.map((project) => ({
        id: project.id,
        title: project.title,
      })),
      isProfilePicture: image.f_profile_picture !== null,
    },
  };
}
