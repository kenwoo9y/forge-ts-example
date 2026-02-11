import { z } from 'zod';

export const taskStatusEnum = z.enum(['todo', 'doing', 'done']);

export const createTaskSchema = z.object({
  title: z.string().max(30).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: taskStatusEnum.nullable().optional(),
  ownerId: z
    .union([z.number().int().positive(), z.string().regex(/^\d+$/)])
    .nullable()
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
