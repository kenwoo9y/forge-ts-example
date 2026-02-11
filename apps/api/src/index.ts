import { serve } from '@hono/node-server';
import { PrismaClient } from 'db/generated/prisma/index.js';
import { Hono } from 'hono';
import { CreateTaskUseCase } from './application/task/createTaskUseCase.js';
import { DeleteTaskUseCase } from './application/task/deleteTaskUseCase.js';
import { GetTaskUseCase } from './application/task/getTaskUseCase.js';
import { UpdateTaskUseCase } from './application/task/updateTaskUseCase.js';
import { CreateUserUseCase } from './application/user/createUserUseCase.js';
import { GetUserUseCase } from './application/user/getUserUseCase.js';
import { PrismaTaskQueryService } from './infrastructure/prisma/task/prismaTaskQueryService.js';
import { PrismaTaskRepository } from './infrastructure/prisma/task/prismaTaskRepository.js';
import { PrismaUserQueryService } from './infrastructure/prisma/user/prismaUserQueryService.js';
import { PrismaUserRepository } from './infrastructure/prisma/user/prismaUserRepository.js';
import { createTaskRoutes } from './presentation/http/task/routes.js';
import { createUserRoutes } from './presentation/http/user/routes.js';

const prisma = new PrismaClient();

// Task - Command side
const taskRepository = new PrismaTaskRepository(prisma);
const createTaskUseCase = new CreateTaskUseCase(taskRepository);
const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);

// Task - Query side
const taskQueryService = new PrismaTaskQueryService(prisma);
const getTaskUseCase = new GetTaskUseCase(taskQueryService);

// User - Command side
const userRepository = new PrismaUserRepository(prisma);
const createUserUseCase = new CreateUserUseCase(userRepository);

// User - Query side
const userQueryService = new PrismaUserQueryService(prisma);
const getUserUseCase = new GetUserUseCase(userQueryService);

const app = new Hono();

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
app.route('/', createUserRoutes({ createUserUseCase, getUserUseCase }));

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
