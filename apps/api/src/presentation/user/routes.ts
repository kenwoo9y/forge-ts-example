import { Hono } from 'hono';
import type { ICreateUserUseCase } from '../../application/user/createUserUseCase.js';
import type { IGetUserUseCase } from '../../application/user/getUserUseCase.js';

interface UserRouteDeps {
  createUserUseCase: ICreateUserUseCase;
  getUserUseCase: IGetUserUseCase;
}

export function createUserRoutes(deps: UserRouteDeps) {
  const app = new Hono();

  app.post('/users', async (c) => {
    const body = await c.req.json();
    const user = await deps.createUserUseCase.execute({
      username: body.username ?? null,
      email: body.email ?? null,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
    });
    return c.json(
      {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      201
    );
  });

  app.get('/users/:username', async (c) => {
    const username = c.req.param('username');
    const user = await deps.getUserUseCase.execute(username);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  });

  return app;
}
