import type { Task } from './entity.js';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export type TaskUpdateData = Partial<Mutable<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>>;

export interface ITaskRepository {
  save(task: Task): Promise<Task>;
  update(id: bigint, data: TaskUpdateData): Promise<Task>;
  delete(id: bigint): Promise<void>;
}
