import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createTaskSchema, updateTaskSchema } from 'schemas';
import { createTaskHandler, type TaskHandlerDeps } from './handler.js';

export function createTaskRoutes(deps: TaskHandlerDeps) {
  const app = new Hono();
  const handler = createTaskHandler(deps);

  app.post('/tasks', zValidator('json', createTaskSchema), handler.createTask);
  app.get('/tasks/:id', handler.getTask);
  app.patch('/tasks/:id', zValidator('json', updateTaskSchema), handler.updateTask);
  app.delete('/tasks/:id', handler.deleteTask);

  return app;
}
