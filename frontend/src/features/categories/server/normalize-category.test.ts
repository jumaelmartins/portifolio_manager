import { describe, expect, it } from "vitest";

import { normalizeCategory, toBackendCategoryInput } from "./normalize-category";

describe("normalizeCategory", () => {
  it("maps the backend category field to name", () => {
    expect(normalizeCategory({ id: 3, category: "Frontend" })).toEqual({
      id: 3,
      name: "Frontend",
    });
  });
});

describe("toBackendCategoryInput", () => {
  it("maps name to the backend category field", () => {
    expect(toBackendCategoryInput({ name: "Backend" })).toEqual({
      category: "Backend",
    });
  });
});
