import { Hono } from 'hono';
import type { ICreateTaskUseCase } from '../../application/task/createTaskUseCase.js';
import type { IGetTaskUseCase } from '../../application/task/getTaskUseCase.js';

interface TaskRouteDeps {
  createTaskUseCase: ICreateTaskUseCase;
  getTaskUseCase: IGetTaskUseCase;
}

export function createTaskRoutes(deps: TaskRouteDeps) {
  const app = new Hono();

  app.post('/tasks', async (c) => {
    const body = await c.req.json();
    const task = await deps.createTaskUseCase.execute({
      title: body.title ?? null,
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status ?? null,
      ownerId: body.ownerId ? BigInt(body.ownerId) : null,
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
  });

  app.get('/tasks/:id', async (c) => {
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
  });

  return app;
}
