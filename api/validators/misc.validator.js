import { z } from "zod";
import { AUDIT_ACTIONS } from "../constants/index.js";
import { idParams, pagination, queryBool } from "./common.js";

export const placeBidSchema = {
  params: idParams,
  body: z.strictObject({
    bidAmount: z.coerce.number().positive("Bid amount must be greater than 0").max(100_000_000),
    message: z.string().trim().min(1, "Message is required").max(500),
    mobile: z
      .union([z.string(), z.number()])
      .transform((v) => String(v).trim())
      .pipe(z.string().regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a valid phone number")),
  }),
};

export const listBidsSchema = { query: z.strictObject(pagination(10)) };
export const productBidsSchema = { params: idParams, query: z.strictObject(pagination(20)) };

export const listNotificationsSchema = {
  query: z.strictObject({ unread: queryBool, ...pagination(20) }),
};
export const notificationIdSchema = { params: idParams };

export const dashboardSchema = {
  query: z.strictObject({
    days: z.coerce.number().int().refine((d) => [7, 30, 90, 365].includes(d), "days must be 7, 30, 90 or 365").default(30),
  }),
};

export const auditLogSchema = {
  query: z.strictObject({
    action: z.enum(Object.values(AUDIT_ACTIONS)).optional(),
    targetType: z.enum(["user", "product"]).optional(),
    ...pagination(20),
  }),
};
