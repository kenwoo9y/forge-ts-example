import { ValueObject } from '../../shared/valueObject.js';

const VALID_STATUSES = ['todo', 'doing', 'done'] as const;
type TaskStatusValue = (typeof VALID_STATUSES)[number];

export class TaskStatus extends ValueObject<TaskStatusValue> {
  private constructor(value: TaskStatusValue) {
    super(value);
  }

  static create(value: string): TaskStatus {
    /* c8 ignore next 4 -- validated by Zod schema before reaching domain */
    if (!VALID_STATUSES.includes(value as TaskStatusValue)) {
      throw new Error(
        `Invalid task status: ${value}. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }
    return new TaskStatus(value as TaskStatusValue);
  }

  toString(): string {
    return this.value;
  }
}
