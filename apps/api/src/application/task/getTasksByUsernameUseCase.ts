import type { IUserQueryService } from '../user/queryService.js';
import type { ITaskQueryService, TaskReadModel } from './queryService.js';

export interface IGetTasksByUsernameUseCase {
  execute(username: string): Promise<TaskReadModel[] | null>;
}

export class GetTasksByUsernameUseCase implements IGetTasksByUsernameUseCase {
  constructor(
    private readonly taskQueryService: ITaskQueryService,
    private readonly userQueryService: IUserQueryService
  ) {}

  async execute(username: string): Promise<TaskReadModel[] | null> {
    const user = await this.userQueryService.findByUsername(username);
    if (!user) {
      return null;
    }
    return this.taskQueryService.findByOwnerId(user.id);
  }
}
