import type { TaskReadModel } from '../dto.js';

export type { TaskReadModel };

export interface ITaskQueryService {
  findById(id: bigint): Promise<TaskReadModel | null>;
  findByOwnerId(ownerId: bigint): Promise<TaskReadModel[]>;
}
