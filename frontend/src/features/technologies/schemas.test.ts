import { describe, expect, it } from "vitest";

import { technologySchema } from "./schemas";

describe("technologySchema", () => {
  it("accepts a valid name and trims it", () => {
    const result = technologySchema.safeParse({ name: "  TypeScript  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("TypeScript");
  });

  it("rejects an empty name", () => {
    const result = technologySchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects a name over 60 characters", () => {
    const result = technologySchema.safeParse({ name: "a".repeat(61) });
    expect(result.success).toBe(false);
  });
});
