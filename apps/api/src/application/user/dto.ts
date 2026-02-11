export type CreateUserInput = {
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type CreateUserOutput = {
  id: bigint;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateUserInput = {
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type UpdateUserOutput = {
  id: bigint;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserReadModel = {
  id: bigint;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
};
