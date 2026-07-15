import { z } from 'zod';

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export type SignupDto = z.infer<typeof signupSchema>;
