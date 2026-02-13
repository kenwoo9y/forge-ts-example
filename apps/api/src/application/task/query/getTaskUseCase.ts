import type { TaskReadModel } from '../dto.js';
import type { ITaskQueryService } from './queryService.js';

export interface IGetTaskUseCase {
  execute(publicId: string): Promise<TaskReadModel | null>;
}

export class GetTaskUseCase implements IGetTaskUseCase {
  constructor(private readonly taskQueryService: ITaskQueryService) {}

  async execute(publicId: string): Promise<TaskReadModel | null> {
    return this.taskQueryService.findByPublicId(publicId);
  }
}
