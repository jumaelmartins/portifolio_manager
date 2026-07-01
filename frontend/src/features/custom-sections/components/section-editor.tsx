"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSection,
  useSections,
  useUpdateSection,
} from "../api/custom-sections-queries";
import type { CustomSectionFormValues } from "../schemas";
import { SectionForm } from "./section-form";

type SectionEditorProps = {
  mode: "create" | "edit";
  sectionId?: number;
};

export function SectionEditor({ mode, sectionId = 0 }: SectionEditorProps) {
  const router = useRouter();
  const sections = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(sectionId) || sectionId <= 0)) {
    return (
      <ErrorState title="Invalid section" description="The requested section ID is not valid." />
    );
  }

  if (editing && sections.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px] max-w-2xl rounded-xl" />
      </div>
    );
  }

  const section = editing ? sections.data?.find((s) => s.id === sectionId) : undefined;

  if (editing && (sections.error || !section)) {
    return (
      <ErrorState
        title="Section unavailable"
        description={sections.error?.message ?? "The section could not be loaded."}
        onRetry={() => void sections.refetch()}
      />
    );
  }

  const defaultValues: CustomSectionFormValues | undefined = section
    ? {
        name: section.name,
        description: section.description ?? "",
        icon: section.icon ?? "",
        fieldSchema: section.fieldSchema.length
          ? section.fieldSchema
          : [{ key: "", label: "", type: "text", required: false }],
      }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/custom-sections"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to custom sections
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit section" : "Add section"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this custom section and its fields."
            : "Create a custom section with its own set of fields."}
        </p>
      </header>

      <SectionForm
        key={editing ? sectionId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateSection.mutateAsync({ id: sectionId, input });
            router.push("/custom-sections?updated=1");
            return;
          }
          await createSection.mutateAsync(input);
          router.push("/custom-sections?created=1");
        }}
      />
    </div>
  );
}
