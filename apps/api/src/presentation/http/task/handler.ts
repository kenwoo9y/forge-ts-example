import type { Context } from 'hono';
import { createTaskSchema } from 'schemas';
import { ZodError } from 'zod';
import type { ICreateTaskUseCase } from '../../../application/task/createTaskUseCase.js';
import type { IGetTaskUseCase } from '../../../application/task/getTaskUseCase.js';

export interface TaskHandlerDeps {
  createTaskUseCase: ICreateTaskUseCase;
  getTaskUseCase: IGetTaskUseCase;
}

export function createTaskHandler(deps: TaskHandlerDeps) {
  return {
    createTask: async (c: Context) => {
      const body = await c.req.json();
      try {
        const validated = createTaskSchema.parse(body);
        const task = await deps.createTaskUseCase.execute({
          title: validated.title ?? null,
          description: validated.description ?? null,
          dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
          status: validated.status ?? null,
          ownerId: validated.ownerId ? BigInt(validated.ownerId) : null,
        });
        return c.json(
          {
            id: task.id.toString(),
            title: task.title,
            description: task.description,
            dueDate: task.dueDate?.toISOString() ?? null,
            status: task.status,
            ownerId: task.ownerId?.toString() ?? null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
          },
          201
        );
      } catch (e) {
        if (e instanceof ZodError) {
          return c.json({ error: 'Validation failed', details: e.errors }, 400);
        }
        throw e;
      }
    },

    getTask: async (c: Context) => {
      const id = BigInt(c.req.param('id'));
      const task = await deps.getTaskUseCase.execute(id);
      if (!task) {
        return c.json({ error: 'Task not found' }, 404);
      }
      return c.json({
        id: task.id.toString(),
        title: task.title,
        description: task.description,
        dueDate: task.dueDate?.toISOString() ?? null,
        status: task.status,
        ownerId: task.ownerId?.toString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      });
    },
  };
}
