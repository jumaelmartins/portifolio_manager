"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

type Identifiable = { id: number };

type SortableListProps<T extends Identifiable> = {
  items: T[];
  onReorder: (ids: number[]) => void;
  getLabel: (item: T) => string;
  children: (item: T) => ReactNode;
  className?: string;
  itemClassName?: string;
};

export function computeReorderedIds<T extends Identifiable>(
  items: T[],
  activeId: number,
  overId: number,
): number[] {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);
  if (oldIndex === -1 || newIndex === -1) return items.map((item) => item.id);
  return arrayMove(items, oldIndex, newIndex).map((item) => item.id);
}

const ROW_CLASS =
  "flex items-center gap-3 rounded-xl border border-border bg-card/70 p-3";

function SortableRow<T extends Identifiable>({
  item,
  label,
  itemClassName,
  children,
}: {
  item: T;
  label: string;
  itemClassName?: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(ROW_CLASS, isDragging && "relative z-10 shadow-lg", itemClassName)}
    >
      <button
        type="button"
        aria-label={`Reorder ${label}`}
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export function SortableList<T extends Identifiable>({
  items,
  onReorder,
  getLabel,
  children,
  className,
  itemClassName,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (items.length < 2) {
    return (
      <ul className={cn("grid gap-3", className)}>
        {items.map((item) => (
          <li key={item.id} className={cn(ROW_CLASS, itemClassName)}>
            <span
              className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/40"
              aria-hidden="true"
            >
              <GripVertical className="size-4" />
            </span>
            <div className="min-w-0 flex-1">{children(item)}</div>
          </li>
        ))}
      </ul>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(computeReorderedIds(items, Number(active.id), Number(over.id)));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={cn("grid gap-3", className)}>
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              label={getLabel(item)}
              itemClassName={itemClassName}
            >
              {children(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
