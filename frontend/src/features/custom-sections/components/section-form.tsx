"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customSectionSchema, type CustomSectionFormValues } from "../schemas";

type SectionFormProps = {
  mode: "create" | "edit";
  defaultValues?: CustomSectionFormValues;
  onSubmit: (input: CustomSectionFormValues) => Promise<void>;
};

const emptyValues: CustomSectionFormValues = {
  name: "",
  description: "",
  icon: "",
  fieldSchema: [{ key: "", label: "", type: "text", required: false }],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function SectionForm({ mode, defaultValues = emptyValues, onSubmit }: SectionFormProps) {
  const form = useForm<CustomSectionFormValues>({
    resolver: zodResolver(customSectionSchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "fieldSchema" });
  const manualKeys = useRef<Set<string>>(new Set());

  async function submit(values: CustomSectionFormValues) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String((caught as { message: unknown }).message)
            : "Unable to save section",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="max-w-2xl space-y-6">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Section details</CardTitle>
            <CardDescription>
              A custom section shown in your public portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cs-name">Name</Label>
              <Input
                id="cs-name"
                aria-label="Section name"
                aria-invalid={Boolean(errors.name)}
                {...form.register("name")}
              />
              <FieldErrors error={errors.name} id="cs-name-error" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cs-description">Description</Label>
              <Input
                id="cs-description"
                aria-label="Description"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cs-icon">Icon</Label>
              <Input
                id="cs-icon"
                aria-label="Icon name"
                placeholder="e.g. Star, Trophy, Award"
                {...form.register("icon")}
              />
              <p className="text-xs text-muted-foreground">Optional Lucide icon name.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Fields</CardTitle>
            <CardDescription>
              Define the fields each item in this section will have.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((item, index) => {
              const labelReg = form.register(`fieldSchema.${index}.label`);
              const keyReg = form.register(`fieldSchema.${index}.key`);
              return (
                <div key={item.id} className="space-y-3 rounded-lg border border-border p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`cs-field-label-${index}`}>Label</Label>
                      <Input
                        id={`cs-field-label-${index}`}
                        aria-label="Field label"
                        {...labelReg}
                        onChange={(event) => {
                          void labelReg.onChange(event);
                          if (!manualKeys.current.has(item.id)) {
                            form.setValue(
                              `fieldSchema.${index}.key`,
                              slugify(event.target.value),
                              { shouldValidate: false },
                            );
                          }
                        }}
                      />
                      <FieldErrors
                        error={errors.fieldSchema?.[index]?.label}
                        id={`cs-field-label-${index}-error`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cs-field-key-${index}`}>Key</Label>
                      <Input
                        id={`cs-field-key-${index}`}
                        aria-label="Field key"
                        {...keyReg}
                        onChange={(event) => {
                          manualKeys.current.add(item.id);
                          void keyReg.onChange(event);
                        }}
                      />
                      <FieldErrors
                        error={errors.fieldSchema?.[index]?.key}
                        id={`cs-field-key-${index}-error`}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`cs-field-type-${index}`}>Type</Label>
                      <select
                        id={`cs-field-type-${index}`}
                        aria-label="Field type"
                        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                        {...form.register(`fieldSchema.${index}.type`)}
                      >
                        <option value="text">Text</option>
                        <option value="url">URL</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id={`cs-field-required-${index}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input accent-primary"
                        aria-label="Required field"
                        {...form.register(`fieldSchema.${index}.required`)}
                      />
                      <Label htmlFor={`cs-field-required-${index}`}>Required</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto mt-6"
                      aria-label="Remove field"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 data-icon="inline-start" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}

            {typeof errors.fieldSchema?.message === "string" ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.fieldSchema.message}
              </p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ key: "", label: "", type: "text", required: false })}
            >
              <Plus data-icon="inline-start" />
              Add field
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/75">
          <CardContent className="space-y-3">
            {errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {form.formState.isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Section"
                  : "Save changes"}
            </Button>
            <Link
              href="/custom-sections"
              className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 w-full" })}
            >
              Cancel
            </Link>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
