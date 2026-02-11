import type { Context } from 'hono';
import { createUserSchema, updateUserSchema } from 'schemas';
import { ZodError } from 'zod';
import type { ICreateUserUseCase } from '../../../application/user/createUserUseCase.js';
import type { IDeleteUserUseCase } from '../../../application/user/deleteUserUseCase.js';
import type { IGetUserUseCase } from '../../../application/user/getUserUseCase.js';
import type { IUpdateUserUseCase } from '../../../application/user/updateUserUseCase.js';

export interface UserHandlerDeps {
  createUserUseCase: ICreateUserUseCase;
  getUserUseCase: IGetUserUseCase;
  updateUserUseCase: IUpdateUserUseCase;
  deleteUserUseCase: IDeleteUserUseCase;
}

export function createUserHandler(deps: UserHandlerDeps) {
  return {
    createUser: async (c: Context) => {
      const body = await c.req.json();
      try {
        const validated = createUserSchema.parse(body);
        const user = await deps.createUserUseCase.execute({
          username: validated.username ?? null,
          email: validated.email ?? null,
          firstName: validated.firstName ?? null,
          lastName: validated.lastName ?? null,
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
      } catch (e) {
        if (e instanceof ZodError) {
          return c.json({ error: 'Validation failed', details: e.errors }, 400);
        }
        throw e;
      }
    },

    getUser: async (c: Context) => {
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
    },

    updateUser: async (c: Context) => {
      const username = c.req.param('username');
      const body = await c.req.json();
      try {
        const validated = updateUserSchema.parse(body);
        const input: Record<string, unknown> = {};
        if ('username' in validated) input.username = validated.username ?? null;
        if ('email' in validated) input.email = validated.email ?? null;
        if ('firstName' in validated) input.firstName = validated.firstName ?? null;
        if ('lastName' in validated) input.lastName = validated.lastName ?? null;

        const user = await deps.updateUserUseCase.execute(username, input);
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
      } catch (e) {
        if (e instanceof ZodError) {
          return c.json({ error: 'Validation failed', details: e.errors }, 400);
        }
        throw e;
      }
    },

    deleteUser: async (c: Context) => {
      const username = c.req.param('username');
      const deleted = await deps.deleteUserUseCase.execute(username);
      if (!deleted) {
        return c.json({ error: 'User not found' }, 404);
      }
      return c.body(null, 204);
    },
  };
}
