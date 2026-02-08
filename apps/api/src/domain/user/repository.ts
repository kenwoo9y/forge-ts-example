import type { User } from './entity.js';

export interface IUserRepository {
  save(user: User): Promise<User>;
}
