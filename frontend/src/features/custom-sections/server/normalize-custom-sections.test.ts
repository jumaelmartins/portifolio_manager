import { describe, expect, it } from "vitest";
import {
  normalizeSection,
  normalizeItem,
  toBackendSectionInput,
} from "./normalize-custom-sections";
import type { BackendCustomSection } from "../types";

const backendSection: BackendCustomSection = {
  id: 1,
  name: "Awards",
  description: "Recognition",
  icon: "Trophy",
  field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
  order: 0,
  user_id: 7,
  items: [{ id: 10, section_id: 1, data: { title: "Best Dev" }, order: 0 }],
};

describe("normalizeSection", () => {
  it("maps field_schema to fieldSchema and normalizes items", () => {
    expect(normalizeSection(backendSection)).toEqual({
      id: 1,
      name: "Awards",
      description: "Recognition",
      icon: "Trophy",
      fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
      order: 0,
      items: [{ id: 10, sectionId: 1, data: { title: "Best Dev" }, order: 0 }],
    });
  });

  it("defaults a missing field_schema to an empty array", () => {
    const result = normalizeSection({ ...backendSection, field_schema: undefined as never });
    expect(result.fieldSchema).toEqual([]);
  });

  it("handles an empty items array", () => {
    expect(normalizeSection({ ...backendSection, items: [] }).items).toEqual([]);
  });
});

describe("normalizeItem", () => {
  it("maps section_id to sectionId and defaults null data to {}", () => {
    expect(normalizeItem({ id: 5, section_id: 2, data: null as never, order: null })).toEqual({
      id: 5,
      sectionId: 2,
      data: {},
      order: null,
    });
  });
});

describe("toBackendSectionInput", () => {
  it("maps fieldSchema to field_schema and omits empty description/icon", () => {
    expect(
      toBackendSectionInput({
        name: "Awards",
        description: "",
        icon: "",
        fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
      }),
    ).toEqual({
      name: "Awards",
      field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
      description: undefined,
      icon: undefined,
    });
  });
});
