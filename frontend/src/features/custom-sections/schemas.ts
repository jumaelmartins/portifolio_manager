import { z } from "zod";
import type { FieldSchema } from "./types";

export const fieldSchemaItemSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Key must start with a letter and contain only lowercase letters, numbers, and underscores",
    ),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "url", "date"]),
  required: z.boolean().optional(),
});

export const customSectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fieldSchema: z.array(fieldSchemaItemSchema).min(1, "At least one field is required"),
});

export type CustomSectionFormValues = z.infer<typeof customSectionSchema>;

// Builds a zod schema for an item's `data` from the section's field schema.
// Required fields must be non-empty; url fields must be valid URLs when non-empty;
// date fields must be YYYY-MM-DD when non-empty.
export function buildItemSchema(fields: FieldSchema[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let validator: z.ZodTypeAny;
    if (field.type === "url") {
      validator = z.string().url("Must be a valid URL");
      if (!field.required) validator = validator.or(z.literal("")).optional();
    } else if (field.type === "date") {
      validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)");
      if (!field.required) validator = validator.or(z.literal("")).optional();
    } else {
      validator = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
    }
    shape[field.key] = validator;
  }
  return z.object(shape);
}
