import { User } from '../../domain/user/entity.js';
import type { IUserRepository } from '../../domain/user/repository.js';

export interface CreateUserInput {
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = new User(
      BigInt(0),
      input.username,
      input.email,
      input.firstName,
      input.lastName,
      new Date(),
      new Date()
    );
    return this.userRepository.save(user);
  }
}
