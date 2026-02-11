import { Hono } from 'hono';
import { createTaskHandler, type TaskHandlerDeps } from './handler.js';

export function createTaskRoutes(deps: TaskHandlerDeps) {
  const app = new Hono();
  const handler = createTaskHandler(deps);

  app.post('/tasks', handler.createTask);
  app.get('/tasks/:id', handler.getTask);
  app.patch('/tasks/:id', handler.updateTask);
  app.delete('/tasks/:id', handler.deleteTask);

  return app;
}
