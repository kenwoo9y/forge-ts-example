import type { UserReadModel } from '../dto.js';

export type { UserReadModel };

export interface IUserQueryService {
  findByUsername(username: string): Promise<UserReadModel | null>;
}
