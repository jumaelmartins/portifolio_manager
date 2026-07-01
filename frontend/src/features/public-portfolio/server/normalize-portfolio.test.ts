import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateRange,
  normalizePortfolio,
  publicUploadUrl,
} from "./normalize-portfolio";
import type { BackendPublicUser } from "../types";

function makeRaw(overrides: Partial<BackendPublicUser> = {}): BackendPublicUser {
  return {
    id: 1,
    username: "jumael",
    role: { id: 1, role: "OWNER" },
    status: { id: 1, status: "ACTIVE" },
    f_profile_picture: { id: 3, f_images: { id: 9, src_path: "uploads/1/avatar.png" } },
    f_projects: [
      {
        id: 5,
        title: "Alpha",
        description: "First",
        repo_url: "https://repo/alpha",
        live_url: null,
        category: { id: 2, category: "Web" },
        technologies: [{ id: 7, tech: "React" }],
        f_images: { id: 9, src_path: "uploads/1/alpha.png" },
        created_at: "2022-01-10T00:00:00.000Z",
        updated_at: "2022-01-10T00:00:00.000Z",
      },
      {
        id: 6,
        title: "Beta",
        description: "Second",
        repo_url: null,
        live_url: null,
        category: null,
        technologies: [],
        f_images: null,
        created_at: "2022-05-10T00:00:00.000Z",
        updated_at: "2022-05-10T00:00:00.000Z",
      },
    ],
    f_experience: [
      {
        id: 11,
        tile: "Engineer",
        company_name: "Acme",
        description: "Built things",
        start_date: "2022-03-15",
        end_date: null,
        created_at: "x",
        updated_at: "x",
      },
    ],
    f_education: [
      {
        id: 21,
        title: "BSc",
        institution_name: "Uni",
        description: "CS",
        start_date: "2018-03-15",
        end_date: "2021-03-15",
        created_at: "x",
        updated_at: "x",
      },
    ],
    f_courses: [
      {
        id: 31,
        title: "Course",
        institution_name: "Platform",
        description: "Learned",
        start_date: "2020-03-15",
        end_date: null,
        created_at: "x",
        updated_at: "x",
      },
    ],
    custom_sections: [
      {
        id: 41,
        name: "Awards",
        description: "Recognitions",
        icon: null,
        field_schema: [{ key: "name", label: "Name", type: "text" }],
        order: 1,
        items: [{ id: 51, data: { name: "Best" }, order: 1 }],
      },
    ],
    created_at: "x",
    updated_at: "x",
    ...overrides,
  };
}

describe("publicUploadUrl", () => {
  it("rewrites a raw src_path to the same-origin proxy path", () => {
    expect(publicUploadUrl("uploads/1/file.png")).toBe("/api/uploads/file/1/file.png");
  });

  it("tolerates a leading slash", () => {
    expect(publicUploadUrl("/uploads/2/pic.png")).toBe("/api/uploads/file/2/pic.png");
  });
});

describe("formatDateRange", () => {
  it("shows 'Present' when there is no end date", () => {
    expect(formatDateRange("2022-03-15", null)).toBe("Mar 2022 – Present");
  });

  it("shows a start–end range", () => {
    expect(formatDateRange("2022-03-15", "2022-06-15")).toBe("Mar 2022 – Jun 2022");
  });

  it("returns an empty string for an unparseable start", () => {
    expect(formatDateRange("nope", null)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a valid date and includes the year", () => {
    expect(formatDate("2022-03-15")).toMatch(/2022/);
  });

  it("returns the raw value when unparseable", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("normalizePortfolio", () => {
  it("maps scalar and role fields", () => {
    const p = normalizePortfolio(makeRaw());
    expect(p.id).toBe(1);
    expect(p.username).toBe("jumael");
    expect(p.role).toBe("OWNER");
  });

  it("builds the avatar URL, or null when absent", () => {
    expect(normalizePortfolio(makeRaw()).avatarUrl).toBe("/api/uploads/file/1/avatar.png");
    expect(normalizePortfolio(makeRaw({ f_profile_picture: null })).avatarUrl).toBeNull();
  });

  it("maps projects, sorts by created_at desc, and handles null cover/category", () => {
    const projects = normalizePortfolio(makeRaw()).projects;
    expect(projects.map((x) => x.id)).toEqual([6, 5]); // Beta (May) before Alpha (Jan)
    const alpha = projects.find((x) => x.id === 5)!;
    expect(alpha.coverUrl).toBe("/api/uploads/file/1/alpha.png");
    expect(alpha.category).toBe("Web");
    expect(alpha.technologies).toEqual(["React"]);
    const beta = projects.find((x) => x.id === 6)!;
    expect(beta.coverUrl).toBeNull();
    expect(beta.category).toBeNull();
  });

  it("maps the experience 'tile' typo to title and company_name to company", () => {
    const exp = normalizePortfolio(makeRaw()).experience[0];
    expect(exp.title).toBe("Engineer");
    expect(exp.company).toBe("Acme");
    expect(exp.endDate).toBeNull();
  });

  it("maps education and courses institution_name to institution", () => {
    const p = normalizePortfolio(makeRaw());
    expect(p.education[0].institution).toBe("Uni");
    expect(p.courses[0].institution).toBe("Platform");
  });

  it("maps custom sections field_schema to fields and items to data", () => {
    const section = normalizePortfolio(makeRaw()).customSections[0];
    expect(section.name).toBe("Awards");
    expect(section.fields).toEqual([{ key: "name", label: "Name", type: "text" }]);
    expect(section.items).toEqual([{ id: 51, data: { name: "Best" } }]);
  });

  it("tolerates empty arrays", () => {
    const p = normalizePortfolio(
      makeRaw({ f_projects: [], f_experience: [], f_education: [], f_courses: [], custom_sections: [] }),
    );
    expect(p.projects).toEqual([]);
    expect(p.customSections).toEqual([]);
  });
});
