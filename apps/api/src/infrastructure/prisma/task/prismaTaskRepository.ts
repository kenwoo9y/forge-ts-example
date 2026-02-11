import type { PrismaClient } from 'db/generated/prisma/index.js';
import { Task } from '../../../domain/task/entity.js';
import type { ITaskRepository } from '../../../domain/task/repository.js';

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(task: Task): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        ownerId: task.ownerId,
      },
    });
    return new Task(
      created.id,
      created.title,
      created.description,
      created.dueDate,
      created.status,
      created.ownerId,
      created.createdAt,
      created.updatedAt
    );
  }
}
