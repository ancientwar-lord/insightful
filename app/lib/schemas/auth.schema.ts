import { z } from 'zod';

const emailSchema = z
  .string()
  .email({ message: 'Please enter a valid email.' })
  .trim()
  .transform((val) => val.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .regex(/[a-zA-Z]/, { message: 'Must contain at least one letter.' })
  .regex(/[0-9]/, { message: 'Must contain at least one number.' })
  .regex(/[^a-zA-Z0-9]/, {
    message: 'Must contain at least one special character.',
  })
  .trim();

export const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }).trim(),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required.' }),
});

// Input type inference.
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
