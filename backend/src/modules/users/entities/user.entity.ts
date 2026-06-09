export class User {
  id: number;
  email: string;
  role_id: number;
  password_hash: string;
  status_id: number;
  auth_method_id: number;
  f_profile_pictureId: number;
  images: Array<Object>;
  f_experience: Array<Object>;
  f_education: Array<Object>;
  f_courses: Array<Object>;
  f_projects: Array<Object>;
  last_login: Date | null;
  online: number;
  created_at: Date | null;
  updated_at: Date | null;
  verified_email: boolean;
  email_verified_at: Date | null;
  f_email_verification_token: Array<Object>;
}
