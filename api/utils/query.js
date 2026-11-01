// Escapes user input for safe use inside a RegExp (prevents regex injection / ReDoS).
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// Adds _id as a tie-breaker so pagination is stable when sort values repeat.
export const toSort = (field, order) => {
  const dir = order === "asc" ? 1 : -1;
  return { [field]: dir, _id: dir };
};
