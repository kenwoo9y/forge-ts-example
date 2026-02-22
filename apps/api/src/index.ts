import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'db/generated/prisma/index.js';
import { cors } from 'hono/cors';
import { pinoLogger } from 'hono-pino';
import { CreateTaskUseCase } from './application/task/command/createTaskUseCase.js';
import { DeleteTaskUseCase } from './application/task/command/deleteTaskUseCase.js';
import { UpdateTaskUseCase } from './application/task/command/updateTaskUseCase.js';
import { GetTasksByUsernameUseCase } from './application/task/query/getTasksByUsernameUseCase.js';
import { GetTaskUseCase } from './application/task/query/getTaskUseCase.js';
import { CreateUserUseCase } from './application/user/command/createUserUseCase.js';
import { DeleteUserUseCase } from './application/user/command/deleteUserUseCase.js';
import { UpdateUserUseCase } from './application/user/command/updateUserUseCase.js';
import { GetUserUseCase } from './application/user/query/getUserUseCase.js';
import { logger } from './infrastructure/logger/index.js';
import { PrismaTaskQueryService } from './infrastructure/prisma/task/prismaTaskQueryService.js';
import { PrismaTaskRepository } from './infrastructure/prisma/task/prismaTaskRepository.js';
import { PrismaUserQueryService } from './infrastructure/prisma/user/prismaUserQueryService.js';
import { PrismaUserRepository } from './infrastructure/prisma/user/prismaUserRepository.js';
import { createTaskRoutes } from './presentation/http/task/routes.js';
import { createUserRoutes } from './presentation/http/user/routes.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// User - Command side
const userRepository = new PrismaUserRepository(prisma);
const createUserUseCase = new CreateUserUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

// User - Query side
const userQueryService = new PrismaUserQueryService(prisma);
const getUserUseCase = new GetUserUseCase(userQueryService);

// Task - Command side
const taskRepository = new PrismaTaskRepository(prisma);
const createTaskUseCase = new CreateTaskUseCase(taskRepository);
const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);

// Task - Query side
const taskQueryService = new PrismaTaskQueryService(prisma);
const getTaskUseCase = new GetTaskUseCase(taskQueryService);
const getTasksByUsernameUseCase = new GetTasksByUsernameUseCase(taskQueryService, userQueryService);

const app = new OpenAPIHono();

app.use(cors({ origin: 'http://localhost:3001' }));
app.use(pinoLogger({ pino: logger }));

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route(
  '/',
  createTaskRoutes({
    createTaskUseCase,
    getTaskUseCase,
    updateTaskUseCase,
    deleteTaskUseCase,
  })
);
app.route(
  '/',
  createUserRoutes({
    createUserUseCase,
    getUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    getTasksByUsernameUseCase,
  })
);

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Task Management API',
    version: '1.0.0',
  },
});

app.get('/docs', swaggerUI({ url: '/openapi.json' }));

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  }
);
