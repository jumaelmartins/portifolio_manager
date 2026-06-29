import { describe, expect, it } from "vitest";
import { normalizeCourse, toBackendCourseInput } from "./normalize-course";

const backendEntry = {
  id: 3,
  title: "AWS Solutions Architect",
  institution_name: "Amazon",
  description: "Cloud certification",
  start_date: "2023-03-01T00:00:00.000Z",
  end_date: "2023-06-30T00:00:00.000Z",
  current: false,
  created_at: "2023-03-01T00:00:00.000Z",
  updated_at: "2023-06-30T00:00:00.000Z",
};

describe("normalizeCourse", () => {
  it("maps snake_case to camelCase", () => {
    expect(normalizeCourse(backendEntry)).toEqual({
      id: 3,
      title: "AWS Solutions Architect",
      institutionName: "Amazon",
      description: "Cloud certification",
      startDate: "2023-03-01",
      endDate: "2023-06-30",
      current: false,
      createdAt: "2023-03-01T00:00:00.000Z",
      updatedAt: "2023-06-30T00:00:00.000Z",
    });
  });
});

describe("toBackendCourseInput", () => {
  it("maps camelCase to snake_case", () => {
    expect(
      toBackendCourseInput({
        title: "AWS SA",
        institutionName: "Amazon",
        startDate: "2023-03-01",
        endDate: "2023-06-30",
        current: false,
      }),
    ).toEqual({
      title: "AWS SA",
      institution_name: "Amazon",
      description: undefined,
      start_date: "2023-03-01",
      end_date: "2023-06-30",
      current: false,
    });
  });

  it("omits end_date when current is true", () => {
    const result = toBackendCourseInput({
      title: "AWS SA",
      institutionName: "Amazon",
      startDate: "2023-03-01",
      current: true,
    });
    expect(result.end_date).toBeUndefined();
  });
});
