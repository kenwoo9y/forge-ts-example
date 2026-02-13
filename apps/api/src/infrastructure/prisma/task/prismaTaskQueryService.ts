import type { PrismaClient } from 'db/generated/prisma/index.js';
import type {
  ITaskQueryService,
  TaskReadModel,
} from '../../../application/task/query/queryService.js';

export class PrismaTaskQueryService implements ITaskQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPublicId(publicId: string): Promise<TaskReadModel | null> {
    const found = await this.prisma.task.findUnique({
      where: { publicId },
    });
    if (!found) return null;
    return this.toReadModel(found);
  }

  async findByOwnerId(ownerId: bigint): Promise<TaskReadModel[]> {
    const tasks = await this.prisma.task.findMany({
      where: { ownerId },
    });
    return tasks.map((task) => this.toReadModel(task));
  }

  private toReadModel(record: {
    publicId: string;
    title: string | null;
    description: string | null;
    dueDate: Date | null;
    status: string | null;
    ownerId: bigint | null;
    createdAt: Date;
    updatedAt: Date;
  }): TaskReadModel {
    return {
      publicId: record.publicId,
      title: record.title,
      description: record.description,
      dueDate: record.dueDate,
      status: record.status,
      ownerId: record.ownerId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
