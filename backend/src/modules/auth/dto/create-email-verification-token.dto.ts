export class EmailVerificationTokenDto {
  id: string;
  token: string;
  code: string;
  userId: number;
  expiresAt: Date;
  isUsed: number;
  usedAt: Date;
  created_at: Date;
}
