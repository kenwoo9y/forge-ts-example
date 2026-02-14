import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { createTaskSchema, taskStatusEnum, updateTaskSchema } from 'schemas';
import { createTaskHandler, type TaskHandlerDeps } from './handler.js';

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

const createTaskRoute = createRoute({
  method: 'post',
  path: '/tasks',
  tags: ['Task'],
  summary: 'Create a task',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Task created',
      content: {
        'application/json': {
          schema: taskResponseSchema,
        },
      },
    },
  },
});

const getTaskRoute = createRoute({
  method: 'get',
  path: '/tasks/{publicId}',
  tags: ['Task'],
  summary: 'Get a task by publicId',
  request: {
    params: z.object({
      publicId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Task found',
      content: {
        'application/json': {
          schema: taskResponseSchema,
        },
      },
    },
    404: {
      description: 'Task not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const updateTaskRoute = createRoute({
  method: 'patch',
  path: '/tasks/{publicId}',
  tags: ['Task'],
  summary: 'Update a task',
  request: {
    params: z.object({
      publicId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateTaskSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Task updated',
      content: {
        'application/json': {
          schema: taskResponseSchema,
        },
      },
    },
    404: {
      description: 'Task not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deleteTaskRoute = createRoute({
  method: 'delete',
  path: '/tasks/{publicId}',
  tags: ['Task'],
  summary: 'Delete a task',
  request: {
    params: z.object({
      publicId: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Task deleted',
    },
    404: {
      description: 'Task not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export function createTaskRoutes(deps: TaskHandlerDeps) {
  const app = new OpenAPIHono();
  const handler = createTaskHandler(deps);

  app.openapi(createTaskRoute, handler.createTask as never);
  app.openapi(getTaskRoute, handler.getTask as never);
  app.openapi(updateTaskRoute, handler.updateTask as never);
  app.openapi(deleteTaskRoute, handler.deleteTask as never);

  return app;
}
