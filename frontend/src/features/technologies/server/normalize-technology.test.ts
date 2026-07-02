import { describe, expect, it } from "vitest";

import {
  normalizeTechnology,
  toBackendTechnologyInput,
} from "./normalize-technology";

describe("normalizeTechnology", () => {
  it("maps the backend tech field to name", () => {
    expect(normalizeTechnology({ id: 2, tech: "TypeScript" })).toEqual({
      id: 2,
      name: "TypeScript",
    });
  });
});

describe("toBackendTechnologyInput", () => {
  it("maps name to the backend tech field", () => {
    expect(toBackendTechnologyInput({ name: "React" })).toEqual({
      tech: "React",
    });
  });
});
