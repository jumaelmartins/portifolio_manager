import { describe, expect, it } from "vitest";
import { normalizeEducation, toBackendEducationInput } from "./normalize-education";

const backendEntry = {
  id: 2,
  title: "BSc Computer Science",
  institution_name: "MIT",
  description: null,
  start_date: "2018-09-01T00:00:00.000Z",
  end_date: "2022-06-30T00:00:00.000Z",
  current: false,
  created_at: "2018-09-01T00:00:00.000Z",
  updated_at: "2022-06-30T00:00:00.000Z",
};

describe("normalizeEducation", () => {
  it("maps snake_case to camelCase", () => {
    expect(normalizeEducation(backendEntry)).toEqual({
      id: 2,
      title: "BSc Computer Science",
      institutionName: "MIT",
      description: null,
      startDate: "2018-09-01",
      endDate: "2022-06-30",
      current: false,
      createdAt: "2018-09-01T00:00:00.000Z",
      updatedAt: "2022-06-30T00:00:00.000Z",
    });
  });
});

describe("toBackendEducationInput", () => {
  it("maps camelCase to snake_case", () => {
    expect(
      toBackendEducationInput({
        title: "BSc CS",
        institutionName: "MIT",
        startDate: "2018-09-01",
        endDate: "2022-06-30",
        current: false,
      }),
    ).toEqual({
      title: "BSc CS",
      institution_name: "MIT",
      description: undefined,
      start_date: "2018-09-01",
      end_date: "2022-06-30",
      current: false,
    });
  });

  it("omits end_date when current is true", () => {
    const result = toBackendEducationInput({
      title: "BSc CS",
      institutionName: "MIT",
      startDate: "2018-09-01",
      current: true,
    });
    expect(result.end_date).toBeUndefined();
  });
});
