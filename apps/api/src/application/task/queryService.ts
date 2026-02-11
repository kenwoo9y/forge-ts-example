export type TaskReadModel = {
  id: bigint;
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ITaskQueryService {
  findById(id: bigint): Promise<TaskReadModel | null>;
  findByOwnerId(ownerId: bigint): Promise<TaskReadModel[]>;
}
