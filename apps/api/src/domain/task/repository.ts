import type { Task } from './entity.js';

export interface ITaskRepository {
  save(task: Task): Promise<Task>;
}
