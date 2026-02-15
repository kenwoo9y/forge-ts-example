import type { Context } from 'hono';
import type { CreateUserInput, UpdateUserInput } from 'schemas';
import type { IGetTasksByUsernameUseCase } from '../../../application/task/query/getTasksByUsernameUseCase.js';
import type { ICreateUserUseCase } from '../../../application/user/command/createUserUseCase.js';
import type { IDeleteUserUseCase } from '../../../application/user/command/deleteUserUseCase.js';
import type { IUpdateUserUseCase } from '../../../application/user/command/updateUserUseCase.js';
import type { IGetUserUseCase } from '../../../application/user/query/getUserUseCase.js';
import { EmailDuplicateError, UsernameDuplicateError } from '../../../domain/user/error.js';

export interface UserHandlerDeps {
  createUserUseCase: ICreateUserUseCase;
  getUserUseCase: IGetUserUseCase;
  updateUserUseCase: IUpdateUserUseCase;
  deleteUserUseCase: IDeleteUserUseCase;
  getTasksByUsernameUseCase: IGetTasksByUsernameUseCase;
}

export function createUserHandler(deps: UserHandlerDeps) {
  return {
    createUser: async (c: Context) => {
      const validated = await c.req.json<CreateUserInput>();
      const { username } = validated;
      /* c8 ignore next 3 -- Zod validates username before handler */
      if (!username) {
        return c.json({ error: 'Username is required' }, 400);
      }
      try {
        const user = await deps.createUserUseCase.execute({
          username,
          email: validated.email ?? null,
          firstName: validated.firstName ?? null,
          lastName: validated.lastName ?? null,
        });
        return c.json(
          {
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
        if (e instanceof UsernameDuplicateError || e instanceof EmailDuplicateError) {
          return c.json({ error: e.message }, 409);
        }
        /* c8 ignore next */
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
      const validated = await c.req.json<UpdateUserInput>();
      const input: Record<string, unknown> = {};
      if ('username' in validated) input.username = validated.username ?? null;
      if ('email' in validated) input.email = validated.email ?? null;
      if ('firstName' in validated) input.firstName = validated.firstName ?? null;
      if ('lastName' in validated) input.lastName = validated.lastName ?? null;

      try {
        const user = await deps.updateUserUseCase.execute(username, input);
        if (!user) {
          return c.json({ error: 'User not found' }, 404);
        }
        return c.json({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        });
      } catch (e) {
        if (e instanceof UsernameDuplicateError || e instanceof EmailDuplicateError) {
          return c.json({ error: e.message }, 409);
        }
        /* c8 ignore next */
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

    getUserTasks: async (c: Context) => {
      const username = c.req.param('username');
      const tasks = await deps.getTasksByUsernameUseCase.execute(username);
      if (!tasks) {
        return c.json({ error: 'User not found' }, 404);
      }
      return c.json(
        tasks.map((task) => ({
          publicId: task.publicId,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate?.toISOString() ?? null,
          status: task.status,
          ownerId: task.ownerId?.toString() ?? null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        }))
      );
    },
  };
}
