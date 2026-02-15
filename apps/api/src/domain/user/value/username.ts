import { ValueObject } from '../../shared/valueObject.js';

const USERNAME_MAX_LENGTH = 30;

export class Username extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Username {
    /* c8 ignore next 6 -- validated by Zod schema before reaching domain */
    if (value.length === 0) {
      throw new Error('Username must not be empty');
    }
    if (value.length > USERNAME_MAX_LENGTH) {
      throw new Error(`Username must be at most ${USERNAME_MAX_LENGTH} characters`);
    }
    return new Username(value);
  }

  toString(): string {
    return this.value;
  }
}
