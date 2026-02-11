import { ValueObject } from '../../shared/valueObject.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Email {
    if (!EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email address: ${value}`);
    }
    return new Email(value);
  }

  toString(): string {
    return this.value;
  }
}
