import { describe, expect, it } from "vitest";

import { categorySchema } from "./schemas";

describe("categorySchema", () => {
  it("accepts a valid name and trims it", () => {
    const result = categorySchema.safeParse({ name: "  Full Stack  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Full Stack");
  });

  it("rejects an empty name", () => {
    const result = categorySchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects a name over 60 characters", () => {
    const result = categorySchema.safeParse({ name: "a".repeat(61) });
    expect(result.success).toBe(false);
  });
});
