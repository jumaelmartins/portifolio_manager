import { describe, expect, it } from "vitest";

import { reorderByIds } from "./reorder-by-ids";

type Row = { id: number; order: number; title: string };

const rows: Row[] = [
  { id: 1, order: 0, title: "a" },
  { id: 2, order: 1, title: "b" },
  { id: 3, order: 2, title: "c" },
];

describe("reorderByIds", () => {
  it("reorders by the id list and rewrites order to the new index", () => {
    expect(reorderByIds(rows, [3, 1, 2])).toEqual([
      { id: 3, order: 0, title: "c" },
      { id: 1, order: 1, title: "a" },
      { id: 2, order: 2, title: "b" },
    ]);
  });

  it("does not mutate the input array or its elements", () => {
    const copy = structuredClone(rows);
    reorderByIds(rows, [2, 1, 3]);
    expect(rows).toEqual(copy);
  });

  it("skips ids that are not present", () => {
    expect(reorderByIds(rows, [2, 99, 1])).toEqual([
      { id: 2, order: 0, title: "b" },
      { id: 1, order: 1, title: "a" },
    ]);
  });
});
