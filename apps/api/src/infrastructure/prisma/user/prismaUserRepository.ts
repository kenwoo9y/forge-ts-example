import type { PrismaClient } from 'db/generated/prisma/index.js';
import { User } from '../../../domain/user/entity.js';
import type { IUserRepository, UserUpdateData } from '../../../domain/user/repository.js';
import { Email } from '../../../domain/user/value/email.js';
import { Username } from '../../../domain/user/value/username.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        username: user.username.toString(),
        email: user.email?.toString() ?? null,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    return this.toEntity(created);
  }

  async update(username: string, data: UserUpdateData): Promise<User> {
    const found = await this.prisma.user.findUnique({ where: { username } });
    if (!found) {
      throw new Error('User not found');
    }

    const prismaData: Record<string, unknown> = {};
    if ('username' in data) prismaData.username = data.username?.toString();
    if ('email' in data) prismaData.email = data.email?.toString() ?? null;
    if ('firstName' in data) prismaData.firstName = data.firstName;
    if ('lastName' in data) prismaData.lastName = data.lastName;

    const updated = await this.prisma.user.update({
      where: { username },
      data: prismaData,
    });
    return this.toEntity(updated);
  }

  async delete(username: string): Promise<void> {
    const found = await this.prisma.user.findUnique({ where: { username } });
    if (!found) {
      throw new Error('User not found');
    }
    await this.prisma.user.delete({ where: { username } });
  }

  private toEntity(record: {
    id: bigint;
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      record.id,
      Username.create(record.username),
      record.email ? Email.create(record.email) : null,
      record.firstName,
      record.lastName,
      record.createdAt,
      record.updatedAt
    );
  }
}
