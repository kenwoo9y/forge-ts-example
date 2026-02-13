import type { TaskStatus } from './value/taskStatus.js';

export class Task {
  constructor(
    public readonly id: bigint,
    public readonly publicId: string,
    public readonly title: string | null,
    public readonly description: string | null,
    public readonly dueDate: Date | null,
    public readonly status: TaskStatus | null,
    public readonly ownerId: bigint | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
