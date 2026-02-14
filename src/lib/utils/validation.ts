import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");
export const nameSchema = z.string().min(2, "Name must be at least 2 characters");
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]+$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));
export const uuidSchema = z.string().uuid("Invalid ID format");
export const positiveDecimalSchema = z.number().positive("Must be a positive number");
export const nonNegativeIntSchema = z.number().int().min(0, "Must be a non-negative integer");
