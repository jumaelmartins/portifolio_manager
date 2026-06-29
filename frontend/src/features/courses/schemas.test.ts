import { describe, expect, it } from "vitest";
import { courseSchema } from "./schemas";

const valid = {
  title: "AWS Solutions Architect",
  institutionName: "Amazon",
  startDate: "2023-03-01",
  endDate: "2023-06-30",
  current: false,
};

describe("courseSchema", () => {
  it("accepts a complete entry", () => {
    expect(courseSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an entry without description", () => {
    expect(courseSchema.safeParse({ ...valid, description: undefined }).success).toBe(true);
  });

  it("rejects when current=false and endDate is empty", () => {
    const result = courseSchema.safeParse({ ...valid, endDate: "", current: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });
});
