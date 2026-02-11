import type { TaskReadModel } from './dto.js';
import type { ITaskQueryService } from './queryService.js';

export interface IGetTaskUseCase {
  execute(id: bigint): Promise<TaskReadModel | null>;
}

export class GetTaskUseCase implements IGetTaskUseCase {
  constructor(private readonly taskQueryService: ITaskQueryService) {}

  async execute(id: bigint): Promise<TaskReadModel | null> {
    return this.taskQueryService.findById(id);
  }
}
