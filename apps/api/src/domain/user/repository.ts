import type { User } from './entity.js';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export type UserUpdateData = Partial<Mutable<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>>;

export interface IUserRepository {
  save(user: User): Promise<User>;
  findByUsername(username: string): Promise<User | null>;
  update(username: string, data: UserUpdateData): Promise<User>;
  delete(username: string): Promise<void>;
}
