import type { ITaskRepository } from '../../../domain/task/repository.js';

export interface IDeleteTaskUseCase {
  execute(publicId: string): Promise<boolean>;
}

export class DeleteTaskUseCase implements IDeleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(publicId: string): Promise<boolean> {
    try {
      await this.taskRepository.delete(publicId);
      return true;
    } catch (e) {
      if (e instanceof Error && e.message === 'Task not found') {
        return false;
      }
      throw e;
    }
  }
}
