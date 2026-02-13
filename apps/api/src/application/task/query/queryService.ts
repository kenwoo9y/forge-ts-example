import type { TaskReadModel } from '../dto.js';

export type { TaskReadModel };

export interface ITaskQueryService {
  findByPublicId(publicId: string): Promise<TaskReadModel | null>;
  findByOwnerId(ownerId: bigint): Promise<TaskReadModel[]>;
}
