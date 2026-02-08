export class User {
  constructor(
    public readonly id: bigint,
    public readonly username: string | null,
    public readonly email: string | null,
    public readonly firstName: string | null,
    public readonly lastName: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
