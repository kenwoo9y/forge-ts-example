import type { Task } from './entity.js';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export type TaskUpdateData = Partial<
  Mutable<Omit<Task, 'id' | 'publicId' | 'createdAt' | 'updatedAt'>>
>;

export interface ITaskRepository {
  save(task: Task): Promise<Task>;
  update(publicId: string, data: TaskUpdateData): Promise<Task>;
  delete(publicId: string): Promise<void>;
}
