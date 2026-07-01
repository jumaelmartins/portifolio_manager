// frontend/src/features/custom-sections/components/items-drawer.tsx
"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateItem, useDeleteItem, useUpdateItem } from "../api/custom-sections-queries";
import type { CustomItem, CustomSection } from "../types";
import { DeleteItemDialog } from "./delete-item-dialog";
import { ItemForm } from "./item-form";

type ItemsDrawerProps = {
  section: CustomSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormMode = null | "create" | CustomItem;

function summarize(section: CustomSection, item: CustomItem): string {
  return section.fieldSchema
    .map((field) => `${field.label}: ${item.data[field.key] || "—"}`)
    .join(" • ");
}

export function ItemsDrawer({ section, open, onOpenChange }: ItemsDrawerProps) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [itemToDelete, setItemToDelete] = useState<CustomItem | null>(null);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setFormMode(null);
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{section?.name ?? "Items"}</SheetTitle>
          <SheetDescription>Manage the items in this section.</SheetDescription>
        </SheetHeader>

        {section ? (
          <div className="space-y-4 p-4">
            {formMode ? (
              <ItemForm
                fields={section.fieldSchema}
                defaultValues={formMode === "create" ? undefined : formMode.data}
                submitLabel={formMode === "create" ? "Add Item" : "Save"}
                onCancel={() => setFormMode(null)}
                onSubmit={async (data) => {
                  if (formMode === "create") {
                    await createItem.mutateAsync({ sectionId: section.id, input: { data } });
                  } else {
                    await updateItem.mutateAsync({ itemId: formMode.id, input: { data } });
                  }
                  setFormMode(null);
                }}
              />
            ) : (
              <>
                <Button onClick={() => setFormMode("create")}>
                  <Plus data-icon="inline-start" />
                  Add Item
                </Button>

                {section.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No items yet. Add the first one.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <span className="text-sm">{summarize(section, item)}</span>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit item"
                            onClick={() => setFormMode(item)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete item"
                            className="text-destructive"
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : null}
      </SheetContent>

      <DeleteItemDialog
        item={itemToDelete}
        open={itemToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setItemToDelete(null);
        }}
        onConfirm={async (item) => {
          await deleteItem.mutateAsync(item.id);
        }}
      />
    </Sheet>
  );
}
