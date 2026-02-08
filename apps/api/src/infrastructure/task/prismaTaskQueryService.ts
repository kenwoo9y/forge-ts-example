import type { PrismaClient } from 'db/generated/prisma/index.js';
import type { ITaskQueryService, TaskReadModel } from '../../application/task/taskQueryService.js';

export class PrismaTaskQueryService implements ITaskQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<TaskReadModel | null> {
    const found = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!found) return null;
    return {
      id: found.id,
      title: found.title,
      description: found.description,
      dueDate: found.dueDate,
      status: found.status,
      ownerId: found.ownerId,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }
}
