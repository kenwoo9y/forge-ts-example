export class Task {
  constructor(
    public readonly id: bigint,
    public readonly title: string | null,
    public readonly description: string | null,
    public readonly dueDate: Date | null,
    public readonly status: string | null,
    public readonly ownerId: bigint | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
