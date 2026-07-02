import type { FieldSchema } from "@/features/custom-sections/types";

import { formatDate } from "../server/normalize-portfolio";
import type { PublicCustomSection } from "../types";
import { SectionShell } from "./section-shell";

function FieldValue({ field, value }: { field: FieldSchema; value: string }) {
  if (field.type === "url") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="underline">
        {value}
      </a>
    );
  }
  if (field.type === "date") {
    return <span>{formatDate(value)}</span>;
  }
  return <span>{value}</span>;
}

export function CustomSections({ sections }: { sections: PublicCustomSection[] }) {
  if (sections.length === 0) return null;
  return (
    <>
      {sections.map((section) => (
        <SectionShell key={section.id} id={`section-${section.id}`} title={section.name}>
          {section.description ? (
            <p className="mb-6 text-muted-foreground">{section.description}</p>
          ) : null}
          <div className="space-y-6">
            {section.items.map((item) => (
              <dl key={item.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const value = item.data[field.key];
                  if (!value) return null;
                  return (
                    <div key={field.key} className="flex flex-col gap-1">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className="text-sm">
                        <FieldValue field={field} value={value} />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ))}
          </div>
        </SectionShell>
      ))}
    </>
  );
}
