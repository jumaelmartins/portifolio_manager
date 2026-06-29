import { describe, expect, it } from "vitest";
import { normalizeExperience, toBackendExperienceInput } from "./normalize-experience";

const backendEntry = {
  id: 1,
  tile: "Software Engineer",
  company_name: "Acme Corp",
  description: "Built things",
  start_date: "2022-01-01T00:00:00.000Z",
  end_date: "2024-06-30T00:00:00.000Z",
  current: false,
  created_at: "2022-01-01T00:00:00.000Z",
  updated_at: "2024-06-30T00:00:00.000Z",
};

describe("normalizeExperience", () => {
  it("maps tile to title and snake_case to camelCase", () => {
    expect(normalizeExperience(backendEntry)).toEqual({
      id: 1,
      title: "Software Engineer",
      companyName: "Acme Corp",
      description: "Built things",
      startDate: "2022-01-01",
      endDate: "2024-06-30",
      current: false,
      createdAt: "2022-01-01T00:00:00.000Z",
      updatedAt: "2024-06-30T00:00:00.000Z",
    });
  });

  it("maps null end_date to null", () => {
    expect(
      normalizeExperience({ ...backendEntry, end_date: null, current: true }).endDate,
    ).toBeNull();
  });
});

describe("toBackendExperienceInput", () => {
  it("maps camelCase to snake_case and title to tile", () => {
    expect(
      toBackendExperienceInput({
        title: "Software Engineer",
        companyName: "Acme Corp",
        description: "Built things",
        startDate: "2022-01-01",
        endDate: "2024-06-30",
        current: false,
      }),
    ).toEqual({
      tile: "Software Engineer",
      company_name: "Acme Corp",
      description: "Built things",
      start_date: "2022-01-01",
      end_date: "2024-06-30",
      current: false,
    });
  });

  it("omits end_date when current is true", () => {
    const result = toBackendExperienceInput({
      title: "Engineer",
      companyName: "Acme",
      description: "Work",
      startDate: "2022-01-01",
      endDate: "2024-06-30",
      current: true,
    });
    expect(result.end_date).toBeUndefined();
  });

  it("omits end_date when endDate is empty string", () => {
    const result = toBackendExperienceInput({
      title: "Engineer",
      companyName: "Acme",
      description: "Work",
      startDate: "2022-01-01",
      endDate: "",
      current: false,
    });
    expect(result.end_date).toBeUndefined();
  });
});
