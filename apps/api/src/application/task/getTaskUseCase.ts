import type { ITaskQueryService, TaskReadModel } from './taskQueryService.js';

export class GetTaskUseCase {
  constructor(private readonly taskQueryService: ITaskQueryService) {}

  async execute(id: bigint): Promise<TaskReadModel | null> {
    return this.taskQueryService.findById(id);
  }
}
