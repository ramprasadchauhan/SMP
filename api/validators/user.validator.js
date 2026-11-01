import { z } from "zod";
import { ROLE_VALUES, USER_STATUS_VALUES } from "../constants/index.js";
import { idParams, order, pagination, search } from "./common.js";

const listFilters = {
  q: search,
  role: z.enum(ROLE_VALUES).optional(),
  status: z.enum(USER_STATUS_VALUES).optional(),
  sort: z.enum(["createdAt", "name", "email", "lastLoginAt"]).default("createdAt"),
  order,
};

export const listUsersSchema = {
  query: z.strictObject({ ...listFilters, ...pagination(10) }),
};

export const exportUsersSchema = {
  query: z.strictObject(listFilters),
};

export const userIdSchema = { params: idParams };

export const updateStatusSchema = {
  params: idParams,
  body: z.strictObject({ status: z.enum(USER_STATUS_VALUES) }),
};

export const updateRoleSchema = {
  params: idParams,
  body: z.strictObject({ role: z.enum(ROLE_VALUES) }),
};
