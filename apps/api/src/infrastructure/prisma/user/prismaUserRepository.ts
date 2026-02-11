import type { PrismaClient } from 'db/generated/prisma/index.js';
import { User } from '../../../domain/user/entity.js';
import type { IUserRepository } from '../../../domain/user/repository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    return new User(
      created.id,
      created.username,
      created.email,
      created.firstName,
      created.lastName,
      created.createdAt,
      created.updatedAt
    );
  }
}
