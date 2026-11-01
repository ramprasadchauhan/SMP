import { z } from "zod";
import { email, newPassword, personName } from "./common.js";

export const registerSchema = {
  body: z.strictObject({ name: personName, email, password: newPassword }),
};

export const loginSchema = {
  body: z.strictObject({
    email,
    password: z.string().min(1, "Password is required").max(128),
  }),
};

export const updateMeSchema = {
  body: z.strictObject({ name: personName }),
};

export const changePasswordSchema = {
  body: z
    .strictObject({
      currentPassword: z.string().min(1, "Current password is required").max(128),
      newPassword,
    })
    .refine((b) => b.currentPassword !== b.newPassword, {
      message: "New password must be different from the current password",
      path: ["newPassword"],
    }),
};
