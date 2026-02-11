import { Hono } from 'hono';
import { createUserHandler, type UserHandlerDeps } from './handler.js';

export function createUserRoutes(deps: UserHandlerDeps) {
  const app = new Hono();
  const handler = createUserHandler(deps);

  app.post('/users', handler.createUser);
  app.get('/users/:username', handler.getUser);
  app.patch('/users/:username', handler.updateUser);
  app.delete('/users/:username', handler.deleteUser);

  return app;
}
