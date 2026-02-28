import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const signupSchema = z.object({
  username: z.string().min(1).max(30),
  email: z.email().max(80).optional(),
  password: passwordSchema,
});

export const signinSchema = z.object({
  username: z.string().min(1).max(30),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
