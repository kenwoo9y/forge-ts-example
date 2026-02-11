import type { IUserRepository, UserUpdateData } from '../../../domain/user/repository.js';
import { Email } from '../../../domain/user/value/email.js';
import type { UpdateUserInput, UpdateUserOutput } from '../dto.js';

export interface IUpdateUserUseCase {
  execute(username: string, input: UpdateUserInput): Promise<UpdateUserOutput | null>;
}

export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(username: string, input: UpdateUserInput): Promise<UpdateUserOutput | null> {
    const data: UserUpdateData = {};

    if ('username' in input) data.username = input.username ?? null;
    if ('email' in input) {
      data.email = input.email ? Email.create(input.email) : null;
    }
    if ('firstName' in input) data.firstName = input.firstName ?? null;
    if ('lastName' in input) data.lastName = input.lastName ?? null;

    try {
      const saved = await this.userRepository.update(username, data);
      return {
        id: saved.id,
        username: saved.username,
        email: saved.email?.toString() ?? null,
        firstName: saved.firstName,
        lastName: saved.lastName,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (e) {
      if (e instanceof Error && e.message === 'User not found') {
        return null;
      }
      throw e;
    }
  }
}
