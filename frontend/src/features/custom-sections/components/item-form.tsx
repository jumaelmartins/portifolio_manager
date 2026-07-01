// frontend/src/features/custom-sections/components/item-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildItemSchema } from "../schemas";
import type { FieldSchema } from "../types";

type ItemFormProps = {
  fields: FieldSchema[];
  defaultValues?: Record<string, string>;
  submitLabel: string;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
};

const INPUT_TYPE: Record<FieldSchema["type"], string> = {
  text: "text",
  url: "url",
  date: "date",
};

export function ItemForm({ fields, defaultValues, submitLabel, onSubmit, onCancel }: ItemFormProps) {
  const schema = useMemo(() => buildItemSchema(fields), [fields]);
  const initialValues = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.key, defaultValues?.[field.key] ?? ""])),
    [fields, defaultValues],
  );

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: Record<string, string>) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save item",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`item-${field.key}`}>
            {field.label}
            {field.required ? <span className="ml-1 text-destructive">*</span> : null}
          </Label>
          <Input
            id={`item-${field.key}`}
            type={INPUT_TYPE[field.type]}
            aria-label={field.label}
            aria-invalid={Boolean(errors[field.key])}
            {...form.register(field.key)}
          />
          <FieldErrors error={errors[field.key]} id={`item-${field.key}-error`} />
        </div>
      ))}

      {errors.root?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
          {form.formState.isSubmitting ? "Saving..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
