export type ProfileData = {
  id: number;
  email: string;
  username: string | null;
  profilePicture: { id: number; url: string } | null;
};

export type ProfileInput = {
  username?: string;
  email?: string;
  profilePictureId?: number;
};

export type PasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type BackendRawImage = {
  id: number;
  src_path: string;
  f_userId: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendProfileData = {
  id: number;
  email: string;
  username: string | null;
  images: BackendRawImage[];
  f_profile_picture: { id: number; f_imagesId: number } | null;
};
