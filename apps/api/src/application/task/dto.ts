export type CreateTaskInput = {
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
};

export type CreateTaskOutput = {
  id: bigint;
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateTaskInput = {
  title?: string | null;
  description?: string | null;
  dueDate?: Date | null;
  status?: string | null;
  ownerId?: bigint | null;
};

export type UpdateTaskOutput = {
  id: bigint;
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};

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
