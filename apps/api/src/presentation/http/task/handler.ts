import type { Context } from 'hono';
import { createTaskSchema, updateTaskSchema } from 'schemas';
import { ZodError } from 'zod';
import type { ICreateTaskUseCase } from '../../../application/task/command/createTaskUseCase.js';
import type { IDeleteTaskUseCase } from '../../../application/task/command/deleteTaskUseCase.js';
import type { IUpdateTaskUseCase } from '../../../application/task/command/updateTaskUseCase.js';
import type { IGetTaskUseCase } from '../../../application/task/query/getTaskUseCase.js';

export interface TaskHandlerDeps {
  createTaskUseCase: ICreateTaskUseCase;
  getTaskUseCase: IGetTaskUseCase;
  updateTaskUseCase: IUpdateTaskUseCase;
  deleteTaskUseCase: IDeleteTaskUseCase;
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

    updateTask: async (c: Context) => {
      const id = BigInt(c.req.param('id'));
      const body = await c.req.json();
      try {
        const validated = updateTaskSchema.parse(body);
        const input: Record<string, unknown> = {};
        if ('title' in validated) input.title = validated.title ?? null;
        if ('description' in validated) input.description = validated.description ?? null;
        if ('dueDate' in validated)
          input.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
        if ('status' in validated) input.status = validated.status ?? null;
        if ('ownerId' in validated)
          input.ownerId = validated.ownerId ? BigInt(validated.ownerId) : null;

        const task = await deps.updateTaskUseCase.execute(id, input);
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
      } catch (e) {
        if (e instanceof ZodError) {
          return c.json({ error: 'Validation failed', details: e.errors }, 400);
        }
        throw e;
      }
    },

    deleteTask: async (c: Context) => {
      const id = BigInt(c.req.param('id'));
      const deleted = await deps.deleteTaskUseCase.execute(id);
      if (!deleted) {
        return c.json({ error: 'Task not found' }, 404);
      }
      return c.body(null, 204);
    },
  };
}
