import { Task } from '../../domain/task/entity.js';
import type { ITaskRepository } from '../../domain/task/repository.js';

export interface CreateTaskInput {
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
}

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = new Task(
      BigInt(0), // ID is assigned by the database
      input.title,
      input.description,
      input.dueDate,
      input.status,
      input.ownerId,
      new Date(),
      new Date()
    );
    return this.taskRepository.save(task);
  }
}
