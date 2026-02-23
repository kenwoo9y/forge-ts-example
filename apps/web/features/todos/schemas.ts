import { createTaskSchema, taskStatusEnum } from "schema";
import { z } from "zod";

export const todoFormSchema = createTaskSchema
  .omit({ ownerId: true, dueDate: true })
  .extend({
    dueDate: z.string().nullable().optional(),
    status: taskStatusEnum,
  });

export type TodoFormValues = z.infer<typeof todoFormSchema>;
