import { User } from '../../../domain/user/entity.js';
import { EmailDuplicateError, UsernameDuplicateError } from '../../../domain/user/error.js';
import type { IUserRepository } from '../../../domain/user/repository.js';
import { Email } from '../../../domain/user/value/email.js';
import { Username } from '../../../domain/user/value/username.js';
import type { CreateUserInput, CreateUserOutput } from '../dto.js';

export interface ICreateUserUseCase {
  execute(input: CreateUserInput): Promise<CreateUserOutput>;
}

export class CreateUserUseCase implements ICreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const username = Username.create(input.username);
    const existing = await this.userRepository.findByUsername(username.toString());
    if (existing) {
      throw new UsernameDuplicateError(username.toString());
    }
    const email = input.email ? Email.create(input.email) : null;
    if (email) {
      const existingEmail = await this.userRepository.findByEmail(email.toString());
      if (existingEmail) {
        throw new EmailDuplicateError(email.toString());
      }
    }
    const user = new User(
      BigInt(0),
      username,
      email,
      input.firstName,
      input.lastName,
      new Date(),
      new Date()
    );
    const saved = await this.userRepository.save(user);
    return {
      username: saved.username.toString(),
      email: saved.email?.toString() ?? null,
      firstName: saved.firstName,
      lastName: saved.lastName,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
