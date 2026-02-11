import { Task } from '../../domain/task/entity.js';
import type { ITaskRepository } from '../../domain/task/repository.js';
import { TaskStatus } from '../../domain/task/value/taskStatus.js';
import type { CreateTaskInput, CreateTaskOutput } from './dto.js';

export interface ICreateTaskUseCase {
  execute(input: CreateTaskInput): Promise<CreateTaskOutput>;
}

export class CreateTaskUseCase implements ICreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const status = input.status ? TaskStatus.create(input.status) : null;
    const task = new Task(
      BigInt(0),
      input.title,
      input.description,
      input.dueDate,
      status,
      input.ownerId,
      new Date(),
      new Date()
    );
    const saved = await this.taskRepository.save(task);
    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      dueDate: saved.dueDate,
      status: saved.status?.toString() ?? null,
      ownerId: saved.ownerId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
