import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiKeysRepository } from './repository/api-keys.repository';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { generateApiKey } from './api-keys.util';

@Injectable()
export class ApiKeysService {
  constructor(private apiKeysRepository: ApiKeysRepository) {}

  async create(userId: number, dto: CreateApiKeyDto) {
    const { fullKey, keyPrefix, keyHash } = generateApiKey();
    const created = await this.apiKeysRepository.create({
      userId,
      label: dto.label,
      keyPrefix,
      keyHash,
    });
    return {
      id: created.id,
      label: created.label,
      key: fullKey, // plaintext — returned only here, never stored
      key_prefix: created.key_prefix,
      created_at: created.created_at,
    };
  }

  async list(userId: number) {
    const keys = await this.apiKeysRepository.findAllByUser(userId);
    return keys.map((k) => ({
      id: k.id,
      label: k.label,
      key_prefix: k.key_prefix,
      created_at: k.created_at,
      last_used_at: k.last_used_at,
      revoked_at: k.revoked_at,
    }));
  }

  async revoke(userId: number, id: number) {
    const revoked = await this.apiKeysRepository.revoke(id, userId);
    if (revoked === 0) {
      throw new NotFoundException('API key not found');
    }
  }
}
