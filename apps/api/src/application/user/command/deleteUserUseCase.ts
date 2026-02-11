import type { IUserRepository } from '../../../domain/user/repository.js';

export interface IDeleteUserUseCase {
  execute(username: string): Promise<boolean>;
}

export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(username: string): Promise<boolean> {
    try {
      await this.userRepository.delete(username);
      return true;
    } catch (e) {
      if (e instanceof Error && e.message === 'User not found') {
        return false;
      }
      throw e;
    }
  }
}
