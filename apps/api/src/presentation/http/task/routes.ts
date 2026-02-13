import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createTaskSchema, updateTaskSchema } from 'schemas';
import { createTaskHandler, type TaskHandlerDeps } from './handler.js';

export function createTaskRoutes(deps: TaskHandlerDeps) {
  const app = new Hono();
  const handler = createTaskHandler(deps);

  app.post('/tasks', zValidator('json', createTaskSchema), handler.createTask);
  app.get('/tasks/:publicId', handler.getTask);
  app.patch('/tasks/:publicId', zValidator('json', updateTaskSchema), handler.updateTask);
  app.delete('/tasks/:publicId', handler.deleteTask);

  return app;
}
