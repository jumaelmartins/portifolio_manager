import { describe, expect, it } from "vitest";
import { experienceSchema } from "./schemas";

const valid = {
  title: "Software Engineer",
  companyName: "Acme Corp",
  description: "Built things",
  startDate: "2022-01-01",
  endDate: "2024-06-30",
  current: false,
};

describe("experienceSchema", () => {
  it("accepts a complete entry", () => {
    expect(experienceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts current=true without endDate", () => {
    expect(
      experienceSchema.safeParse({ ...valid, endDate: "", current: true }).success,
    ).toBe(true);
  });

  it("rejects when current=false and endDate is empty", () => {
    const result = experienceSchema.safeParse({ ...valid, endDate: "", current: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });

  it("rejects missing title", () => {
    const result = experienceSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid startDate format", () => {
    const result = experienceSchema.safeParse({ ...valid, startDate: "01/01/2022" });
    expect(result.success).toBe(false);
  });
});
