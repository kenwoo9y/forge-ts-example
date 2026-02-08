import type { IUserQueryService, UserReadModel } from './userQueryService.js';

export interface IGetUserUseCase {
  execute(username: string): Promise<UserReadModel | null>;
}

export class GetUserUseCase implements IGetUserUseCase {
  constructor(private readonly userQueryService: IUserQueryService) {}

  async execute(username: string): Promise<UserReadModel | null> {
    return this.userQueryService.findByUsername(username);
  }
}
