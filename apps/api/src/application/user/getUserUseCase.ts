import type { IUserQueryService, UserReadModel } from './userQueryService.js';

export class GetUserUseCase {
  constructor(private readonly userQueryService: IUserQueryService) {}

  async execute(username: string): Promise<UserReadModel | null> {
    return this.userQueryService.findByUsername(username);
  }
}
