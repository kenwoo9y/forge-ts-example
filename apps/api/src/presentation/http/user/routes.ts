import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createUserSchema, updateUserSchema } from 'schemas';
import { createUserHandler, type UserHandlerDeps } from './handler.js';

export function createUserRoutes(deps: UserHandlerDeps) {
  const app = new Hono();
  const handler = createUserHandler(deps);

  app.post('/users', zValidator('json', createUserSchema), handler.createUser);
  app.get('/users/:username', handler.getUser);
  app.patch('/users/:username', zValidator('json', updateUserSchema), handler.updateUser);
  app.delete('/users/:username', handler.deleteUser);
  app.get('/users/:username/tasks', handler.getUserTasks);

  return app;
}
