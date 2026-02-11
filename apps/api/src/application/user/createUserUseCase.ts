import { User } from '../../domain/user/entity.js';
import type { IUserRepository } from '../../domain/user/repository.js';
import { Email } from '../../domain/user/value/email.js';

export type CreateUserInput = {
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type CreateUserOutput = {
  id: bigint;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ICreateUserUseCase {
  execute(input: CreateUserInput): Promise<CreateUserOutput>;
}

export class CreateUserUseCase implements ICreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const email = input.email ? Email.create(input.email) : null;
    const user = new User(
      BigInt(0),
      input.username,
      email,
      input.firstName,
      input.lastName,
      new Date(),
      new Date()
    );
    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      username: saved.username,
      email: saved.email?.toString() ?? null,
      firstName: saved.firstName,
      lastName: saved.lastName,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
