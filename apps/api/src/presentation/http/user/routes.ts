import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { createUserSchema, taskStatusEnum, updateUserSchema } from 'schemas';
import { createUserHandler, type UserHandlerDeps } from './handler.js';

const userResponseSchema = z.object({
  username: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const taskResponseSchema = z.object({
  publicId: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  dueDate: z.string().nullable(),
  status: taskStatusEnum.nullable(),
  ownerId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  tags: ['User'],
  summary: 'Create a user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': {
          schema: userResponseSchema,
        },
      },
    },
    409: {
      description: 'Username or email already exists',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{username}',
  tags: ['User'],
  summary: 'Get a user by username',
  request: {
    params: z.object({
      username: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'User found',
      content: {
        'application/json': {
          schema: userResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const updateUserRoute = createRoute({
  method: 'patch',
  path: '/users/{username}',
  tags: ['User'],
  summary: 'Update a user',
  request: {
    params: z.object({
      username: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated',
      content: {
        'application/json': {
          schema: userResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: 'Username or email already exists',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{username}',
  tags: ['User'],
  summary: 'Delete a user',
  request: {
    params: z.object({
      username: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'User deleted',
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getUserTasksRoute = createRoute({
  method: 'get',
  path: '/users/{username}/tasks',
  tags: ['User'],
  summary: "Get a user's tasks",
  request: {
    params: z.object({
      username: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Tasks found',
      content: {
        'application/json': {
          schema: z.array(taskResponseSchema),
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export function createUserRoutes(deps: UserHandlerDeps) {
  const app = new OpenAPIHono();
  const handler = createUserHandler(deps);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  app.openapi(createUserRoute, handler.createUser as never);
  app.openapi(getUserRoute, handler.getUser as never);
  app.openapi(updateUserRoute, handler.updateUser as never);
  app.openapi(deleteUserRoute, handler.deleteUser as never);
  app.openapi(getUserTasksRoute, handler.getUserTasks as never);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return app;
}
