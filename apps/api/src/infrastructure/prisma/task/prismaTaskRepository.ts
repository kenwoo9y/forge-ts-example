import type { PrismaClient } from 'db/generated/prisma/index.js';
import { Task } from '../../../domain/task/entity.js';
import type { ITaskRepository, TaskUpdateData } from '../../../domain/task/repository.js';
import { TaskStatus } from '../../../domain/task/value/taskStatus.js';

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(task: Task): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status?.toString() ?? null,
        ownerId: task.ownerId,
      },
    });
    return this.toEntity(created);
  }

  async update(publicId: string, data: TaskUpdateData): Promise<Task> {
    const prismaData: Record<string, unknown> = {};
    if ('title' in data) prismaData.title = data.title;
    if ('description' in data) prismaData.description = data.description;
    if ('dueDate' in data) prismaData.dueDate = data.dueDate;
    if ('status' in data) prismaData.status = data.status?.toString() ?? null;
    if ('ownerId' in data) prismaData.ownerId = data.ownerId;

    try {
      const updated = await this.prisma.task.update({
        where: { publicId },
        data: prismaData,
      });
      return this.toEntity(updated);
    } catch (e) {
      if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'P2025') {
        throw new Error('Task not found');
      }
      throw e;
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { publicId } });
    } catch (e) {
      if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'P2025') {
        throw new Error('Task not found');
      }
      throw e;
    }
  }

  private toEntity(record: {
    id: bigint;
    publicId: string;
    title: string | null;
    description: string | null;
    dueDate: Date | null;
    status: string | null;
    ownerId: bigint | null;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return new Task(
      record.id,
      record.publicId,
      record.title,
      record.description,
      record.dueDate,
      record.status ? TaskStatus.create(record.status) : null,
      record.ownerId,
      record.createdAt,
      record.updatedAt
    );
  }
}
