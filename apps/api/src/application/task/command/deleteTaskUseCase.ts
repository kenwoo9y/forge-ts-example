import type { ITaskRepository } from '../../../domain/task/repository.js';

export interface IDeleteTaskUseCase {
  execute(id: bigint): Promise<boolean>;
}

export class DeleteTaskUseCase implements IDeleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(id: bigint): Promise<boolean> {
    try {
      await this.taskRepository.delete(id);
      return true;
    } catch (e) {
      if (e instanceof Error && e.message === 'Task not found') {
        return false;
      }
      throw e;
    }
  }
}
