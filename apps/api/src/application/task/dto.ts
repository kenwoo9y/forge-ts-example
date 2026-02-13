export type CreateTaskInput = {
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
};

export type CreateTaskOutput = {
  publicId: string;
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
  publicId: string;
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskReadModel = {
  publicId: string;
  title: string | null;
  description: string | null;
  dueDate: Date | null;
  status: string | null;
  ownerId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};
