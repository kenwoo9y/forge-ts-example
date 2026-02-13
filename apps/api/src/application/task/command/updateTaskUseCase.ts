import type { ITaskRepository, TaskUpdateData } from '../../../domain/task/repository.js';
import { TaskStatus } from '../../../domain/task/value/taskStatus.js';
import type { UpdateTaskInput, UpdateTaskOutput } from '../dto.js';

export interface IUpdateTaskUseCase {
  execute(publicId: string, input: UpdateTaskInput): Promise<UpdateTaskOutput | null>;
}

export class UpdateTaskUseCase implements IUpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(publicId: string, input: UpdateTaskInput): Promise<UpdateTaskOutput | null> {
    const data: TaskUpdateData = {};

    if ('title' in input) data.title = input.title ?? null;
    if ('description' in input) data.description = input.description ?? null;
    if ('dueDate' in input) data.dueDate = input.dueDate ?? null;
    if ('status' in input) {
      data.status = input.status ? TaskStatus.create(input.status) : null;
    }
    if ('ownerId' in input) data.ownerId = input.ownerId ?? null;

    try {
      const saved = await this.taskRepository.update(publicId, data);
      return {
        publicId: saved.publicId,
        title: saved.title,
        description: saved.description,
        dueDate: saved.dueDate,
        status: saved.status?.toString() ?? null,
        ownerId: saved.ownerId,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (e) {
      if (e instanceof Error && e.message === 'Task not found') {
        return null;
      }
      throw e;
    }
  }
}
