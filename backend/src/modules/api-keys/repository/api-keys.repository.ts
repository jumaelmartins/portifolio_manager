import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

type CreateApiKeyData = {
  userId: number;
  label: string;
  keyPrefix: string;
  keyHash: string;
};

@Injectable()
export class ApiKeysRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateApiKeyData) {
    return this.prismaService.f_api_key.create({
      data: {
        user_id: data.userId,
        label: data.label,
        key_prefix: data.keyPrefix,
        key_hash: data.keyHash,
      },
    });
  }

  async findAllByUser(userId: number) {
    return this.prismaService.f_api_key.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findActiveByHash(keyHash: string) {
    return this.prismaService.f_api_key.findFirst({
      where: { key_hash: keyHash, revoked_at: null },
    });
  }

  /** Soft-revoke the caller's own key. Returns rows updated (0 = not owned). */
  async revoke(id: number, userId: number) {
    const result = await this.prismaService.f_api_key.updateMany({
      where: { id, user_id: userId },
      data: { revoked_at: new Date() },
    });
    return result.count;
  }

  async touchLastUsed(id: number) {
    return this.prismaService.f_api_key.update({
      where: { id },
      data: { last_used_at: new Date() },
    });
  }
}
