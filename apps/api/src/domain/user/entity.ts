import type { Email } from './value/email.js';
import type { Username } from './value/username.js';

export class User {
  constructor(
    public readonly id: bigint,
    public readonly username: Username,
    public readonly email: Email | null,
    public readonly firstName: string | null,
    public readonly lastName: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
