// frontend/src/features/custom-sections/components/items-drawer.tsx
"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ContentRowActions } from "@/components/ui/content-row-actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SortableList } from "@/components/ui/sortable-list";
import { StateFilter } from "@/components/ui/state-filter";
import type { ContentState } from "@/lib/content-state";
import {
  useArchiveItem,
  useCreateItem,
  useDeleteItem,
  usePurgeItem,
  useReorderItems,
  useRestoreItem,
  useSectionItems,
  useUnarchiveItem,
  useUpdateItem,
} from "../api/custom-sections-queries";
import type { CustomItem, CustomSection } from "../types";
import { DeleteItemDialog } from "./delete-item-dialog";
import { ItemForm } from "./item-form";

type ItemsDrawerProps = {
  section: CustomSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormMode = null | "create" | CustomItem;

const ROW_CLASS = "flex items-center gap-3 rounded-xl border border-border bg-card/70 p-3";

function summarize(section: CustomSection, item: CustomItem): string {
  return section.fieldSchema
    .map((field) => `${field.label}: ${item.data[field.key] || "—"}`)
    .join(" • ");
}

function emptyMessage(state: ContentState): string {
  if (state === "archived") return "No archived items.";
  if (state === "trash") return "Trash is empty.";
  return "No items yet. Add the first one.";
}

export function ItemsDrawer({ section, open, onOpenChange }: ItemsDrawerProps) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [drawerState, setDrawerState] = useState<ContentState>("active");
  const [itemToPurge, setItemToPurge] = useState<CustomItem | null>(null);

  const sectionId = section?.id ?? 0;
  const itemsQuery = useSectionItems(sectionId, drawerState);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const archiveItem = useArchiveItem(sectionId);
  const unarchiveItem = useUnarchiveItem(sectionId);
  const restoreItem = useRestoreItem(sectionId);
  const purgeItem = usePurgeItem(sectionId);
  const reorderItems = useReorderItems(sectionId);

  const items = itemsQuery.data ?? [];

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFormMode(null);
      setDrawerState("active");
    }
    onOpenChange(nextOpen);
  }

  function renderItemActions(item: CustomItem, label: string) {
    return (
      <ContentRowActions
        state={drawerState}
        label={label}
        onEdit={() => setFormMode(item)}
        onArchive={() => archiveItem.mutate(item.id)}
        onUnarchive={() => unarchiveItem.mutate(item.id)}
        onRestore={() => restoreItem.mutate(item.id)}
        onSoftDelete={() => deleteItem.mutate(item.id)}
        onPurge={() => setItemToPurge(item)}
      />
    );
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

                <StateFilter value={drawerState} onChange={setDrawerState} />

                {itemsQuery.isPending ? (
                  <p className="text-sm text-muted-foreground">Loading items…</p>
                ) : itemsQuery.error ? (
                  <p role="alert" className="text-sm text-destructive">
                    Unable to load items.
                  </p>
                ) : items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    {emptyMessage(drawerState)}
                  </p>
                ) : drawerState === "active" ? (
                  <SortableList
                    items={items}
                    onReorder={(ids) => reorderItems.mutate(ids)}
                    getLabel={(item) => summarize(section, item)}
                  >
                    {(item) => {
                      const label = summarize(section, item);
                      return (
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm">{label}</span>
                          {renderItemActions(item, label)}
                        </div>
                      );
                    }}
                  </SortableList>
                ) : (
                  <ul className="grid gap-3">
                    {items.map((item) => {
                      const label = summarize(section, item);
                      return (
                        <li key={item.id} className={ROW_CLASS}>
                          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                            <span className="text-sm">{label}</span>
                            {renderItemActions(item, label)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : null}
      </SheetContent>

      <DeleteItemDialog
        item={itemToPurge}
        open={itemToPurge !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setItemToPurge(null);
        }}
        onConfirm={async (item) => {
          await purgeItem.mutateAsync(item.id);
        }}
      />
    </Sheet>
  );
}
