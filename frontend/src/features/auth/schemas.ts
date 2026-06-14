import { z } from "zod";

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add one uppercase letter")
  .regex(/\d/, "Add one number")
  .regex(/[@$!%*?&]/, "Add one special character");

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z
  .object({
    username: z.string().min(3, "Use at least 3 characters").max(40),
    email: z.email("Enter a valid email"),
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const verificationSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegistrationValues = z.infer<typeof registrationSchema>;
export type VerificationValues = z.infer<typeof verificationSchema>;
