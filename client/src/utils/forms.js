// Mirrors the server's password policy for instant feedback; the server
// remains authoritative.
export const newPasswordRules = [
  { required: true, message: "Enter a password" },
  { min: 8, message: "Use at least 8 characters" },
  { max: 128, message: "Use at most 128 characters" },
  { pattern: /[A-Za-z]/, message: "Include at least one letter" },
  { pattern: /[0-9]/, message: "Include at least one number" },
];

// Maps a 422 response's field details onto antd form fields. Returns true when
// at least one field error was shown inline.
export function applyServerErrors(form, err) {
  const known = new Set(Object.keys(form.getFieldsValue()));
  const fields = (err?.details || [])
    .filter((d) => d.field && known.has(d.field.split(".")[0]))
    .map((d) => ({ name: d.field.split("."), errors: [d.message] }));
  if (err?.code === "EMAIL_TAKEN" || err?.code === "DUPLICATE") {
    fields.push({ name: ["email"], errors: [err.message] });
  }
  if (fields.length) form.setFields(fields);
  return fields.length > 0;
}
