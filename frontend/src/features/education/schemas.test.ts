import { describe, expect, it } from "vitest";
import { educationSchema } from "./schemas";

const valid = {
  title: "BSc Computer Science",
  institutionName: "MIT",
  startDate: "2018-09-01",
  endDate: "2022-06-30",
  current: false,
};

describe("educationSchema", () => {
  it("accepts a complete entry", () => {
    expect(educationSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an entry without description", () => {
    expect(educationSchema.safeParse({ ...valid, description: undefined }).success).toBe(true);
  });

  it("accepts current=true without endDate", () => {
    expect(
      educationSchema.safeParse({ ...valid, endDate: "", current: true }).success,
    ).toBe(true);
  });

  it("rejects when current=false and endDate is empty", () => {
    const result = educationSchema.safeParse({ ...valid, endDate: "", current: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });
});
