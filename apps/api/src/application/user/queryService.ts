export type UserReadModel = {
  id: bigint;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IUserQueryService {
  findByUsername(username: string): Promise<UserReadModel | null>;
}
