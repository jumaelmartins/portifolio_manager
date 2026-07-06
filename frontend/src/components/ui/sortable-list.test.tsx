// frontend/src/components/ui/sortable-list.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SortableList, computeReorderedIds } from "./sortable-list";

type Row = { id: number; title: string };
const rows: Row[] = [
  { id: 10, title: "Alpha" },
  { id: 20, title: "Bravo" },
  { id: 30, title: "Charlie" },
];

describe("computeReorderedIds", () => {
  it("moves the active item into the over item's slot", () => {
    expect(computeReorderedIds(rows, 10, 30)).toEqual([20, 30, 10]);
    expect(computeReorderedIds(rows, 30, 10)).toEqual([30, 10, 20]);
  });

  it("returns the current order when an id is missing", () => {
    expect(computeReorderedIds(rows, 10, 999)).toEqual([10, 20, 30]);
  });
});

describe("SortableList", () => {
  it("renders a labelled drag handle and body per item", () => {
    render(
      <SortableList
        items={rows}
        onReorder={() => {}}
        getLabel={(row) => row.title}
      >
        {(row) => <span>{row.title}</span>}
      </SortableList>,
    );
    expect(screen.getByRole("button", { name: "Reorder Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reorder Bravo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reorder Charlie" })).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders inert rows without drag handles when fewer than 2 items", () => {
    render(
      <SortableList
        items={[{ id: 10, title: "Alpha" }]}
        onReorder={() => {}}
        getLabel={(row) => row.title}
      >
        {(row) => <span>{row.title}</span>}
      </SortableList>,
    );
    expect(screen.queryByRole("button", { name: /Reorder/ })).not.toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
