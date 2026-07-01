import { describe, expect, it } from "vitest";
import { customSectionSchema, buildItemSchema } from "./schemas";
import type { FieldSchema } from "./types";

const validSection = {
  name: "Awards",
  description: "Recognition",
  icon: "Trophy",
  fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
};

describe("customSectionSchema", () => {
  it("accepts a valid section", () => {
    expect(customSectionSchema.safeParse(validSection).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(customSectionSchema.safeParse({ ...validSection, name: "" }).success).toBe(false);
  });

  it("rejects an invalid key pattern", () => {
    const result = customSectionSchema.safeParse({
      ...validSection,
      fieldSchema: [{ key: "1bad", label: "Title", type: "text" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty fieldSchema array", () => {
    const result = customSectionSchema.safeParse({ ...validSection, fieldSchema: [] });
    expect(result.success).toBe(false);
  });
});

describe("buildItemSchema", () => {
  const fields: FieldSchema[] = [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "link", label: "Link", type: "url", required: false },
  ];

  it("errors when a required text field is empty", () => {
    const result = buildItemSchema(fields).safeParse({ title: "", link: "" });
    expect(result.success).toBe(false);
  });

  it("errors when a url field is not a valid URL", () => {
    const result = buildItemSchema(fields).safeParse({ title: "Best Dev", link: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("passes when optional fields are empty and required are filled", () => {
    const result = buildItemSchema(fields).safeParse({ title: "Best Dev", link: "" });
    expect(result.success).toBe(true);
  });
});
