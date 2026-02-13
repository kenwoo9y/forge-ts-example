import type { Context } from 'hono';
import type { CreateTaskInput, UpdateTaskInput } from 'schemas';
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
      const validated = await c.req.json<CreateTaskInput>();
      const task = await deps.createTaskUseCase.execute({
        title: validated.title ?? null,
        description: validated.description ?? null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        status: validated.status ?? null,
        ownerId: validated.ownerId ? BigInt(validated.ownerId) : null,
      });
      return c.json(
        {
          publicId: task.publicId,
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
    },

    getTask: async (c: Context) => {
      const publicId = c.req.param('publicId');
      const task = await deps.getTaskUseCase.execute(publicId);
      if (!task) {
        return c.json({ error: 'Task not found' }, 404);
      }
      return c.json({
        publicId: task.publicId,
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
      const publicId = c.req.param('publicId');
      const validated = await c.req.json<UpdateTaskInput>();
      const input: Record<string, unknown> = {};
      if ('title' in validated) input.title = validated.title ?? null;
      if ('description' in validated) input.description = validated.description ?? null;
      if ('dueDate' in validated)
        input.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
      if ('status' in validated) input.status = validated.status ?? null;
      if ('ownerId' in validated)
        input.ownerId = validated.ownerId ? BigInt(validated.ownerId) : null;

      const task = await deps.updateTaskUseCase.execute(publicId, input);
      if (!task) {
        return c.json({ error: 'Task not found' }, 404);
      }
      return c.json({
        publicId: task.publicId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate?.toISOString() ?? null,
        status: task.status,
        ownerId: task.ownerId?.toString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      });
    },

    deleteTask: async (c: Context) => {
      const publicId = c.req.param('publicId');
      const deleted = await deps.deleteTaskUseCase.execute(publicId);
      if (!deleted) {
        return c.json({ error: 'Task not found' }, 404);
      }
      return c.body(null, 204);
    },
  };
}
