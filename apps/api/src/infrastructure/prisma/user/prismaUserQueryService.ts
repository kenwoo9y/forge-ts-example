import type { PrismaClient } from 'db/generated/prisma/index.js';
import type {
  IUserQueryService,
  UserReadModel,
} from '../../../application/user/query/queryService.js';

export class PrismaUserQueryService implements IUserQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUsername(username: string): Promise<UserReadModel | null> {
    const found = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!found) return null;
    return {
      id: found.id, // kept for internal use (e.g. task lookup by ownerId)
      username: found.username,
      email: found.email,
      firstName: found.firstName,
      lastName: found.lastName,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }
}
