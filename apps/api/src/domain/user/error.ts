export class UsernameDuplicateError extends Error {
  constructor(username: string) {
    super(`Username '${username}' is already taken`);
    this.name = 'UsernameDuplicateError';
  }
}

export class EmailDuplicateError extends Error {
  constructor(email: string) {
    super(`Email '${email}' is already taken`);
    this.name = 'EmailDuplicateError';
  }
}
