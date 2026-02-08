import { Task } from '../../domain/task/entity.js';
import type { ITaskRepository } from '../../domain/task/repository.js';

export interface CreateTaskInput {
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
}

export interface CreateTaskOutput {
  id: bigint;
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTaskUseCase {
  execute(input: CreateTaskInput): Promise<CreateTaskOutput>;
}

export class CreateTaskUseCase implements ICreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const task = new Task(
      BigInt(0),
      input.title,
      input.description,
      input.dueDate,
      input.status,
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
      status: saved.status,
      ownerId: saved.ownerId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
