import mongoose from "mongoose";
import { z } from "zod";

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f0-9]{24}$/i.test(v), "Invalid id");

export const idParams = z.strictObject({ id: objectId });

export const pagination = (defaultLimit = 10) => ({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(defaultLimit),
});

export const order = z.enum(["asc", "desc"]).default("desc");

// Free-text search: trimmed, bounded, empty → undefined.
export const search = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => v || undefined);

// Accepts `?x=a&x=b` (array) or `?x=a` (string) and always yields an array.
export const multi = (item) =>
  z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(item).max(20));

export const queryBool = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true"));

export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254));

// Applies to new passwords only; existing users keep signing in with theirs.
export const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const personName = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");
