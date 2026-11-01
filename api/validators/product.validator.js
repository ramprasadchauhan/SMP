import { z } from "zod";
import {
  PRODUCT_AGE_RANGES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS_VALUES,
} from "../constants/index.js";
import { idParams, multi, objectId, order, pagination, search } from "./common.js";

// Only these fields can be written by clients. `seller` and `status` are
// always set server-side, which blocks mass-assignment.
const productFields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  price: z.coerce.number().min(0, "Price cannot be negative").max(100_000_000),
  category: z.string().trim().toLowerCase().pipe(z.enum(PRODUCT_CATEGORIES)),
  age: z.coerce.number().int("Age must be a whole number of years").min(0).max(100),
  billAvailable: z.boolean(),
  warrantyAvailable: z.boolean(),
  accessoriesAvailable: z.boolean(),
  boxAvailable: z.boolean(),
  showBidsOnProductPage: z.boolean(),
};

const flagDefaults = Object.fromEntries(
  ["billAvailable", "warrantyAvailable", "accessoriesAvailable", "boxAvailable", "showBidsOnProductPage"].map(
    (k) => [k, z.boolean().default(false)]
  )
);

export const createProductSchema = { body: z.strictObject({ ...productFields, ...flagDefaults }) };

export const updateProductSchema = {
  params: idParams,
  body: z
    .strictObject(productFields)
    .partial()
    .refine((b) => Object.keys(b).length > 0, "Provide at least one field to update"),
};

export const productIdSchema = { params: idParams };

export const marketplaceSchema = {
  query: z.strictObject({
    q: search,
    category: multi(z.enum(PRODUCT_CATEGORIES)),
    age: multi(z.enum(Object.keys(PRODUCT_AGE_RANGES))),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(["newest", "oldest", "price_asc", "price_desc"]).default("newest"),
    ...pagination(12),
  }),
};

export const mineSchema = {
  query: z.strictObject({
    q: search,
    status: z.enum(PRODUCT_STATUS_VALUES).optional(),
    sort: z.enum(["createdAt", "name", "price"]).default("createdAt"),
    order,
    ...pagination(10),
  }),
};

const manageFilters = {
  q: search,
  status: z.enum(PRODUCT_STATUS_VALUES).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  seller: objectId.optional(),
  sort: z.enum(["createdAt", "name", "price", "status"]).default("createdAt"),
  order,
};

export const manageSchema = { query: z.strictObject({ ...manageFilters, ...pagination(10) }) };
export const manageExportSchema = { query: z.strictObject(manageFilters) };

export const updateStatusSchema = {
  params: idParams,
  body: z.strictObject({ status: z.enum(PRODUCT_STATUS_VALUES) }),
};

export const removeImageSchema = {
  params: idParams,
  body: z.strictObject({ url: z.url().max(500) }),
};
