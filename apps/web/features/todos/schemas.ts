import { createTaskSchema } from "schemas";
import { z } from "zod";

export const todoFormSchema = createTaskSchema
  .omit({ ownerId: true, dueDate: true })
  .extend({
    dueDate: z.string().nullable().optional(),
  });

export type TodoFormValues = z.infer<typeof todoFormSchema>;
