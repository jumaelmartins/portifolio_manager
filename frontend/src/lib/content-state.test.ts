import { describe, expect, it } from "vitest";
import { parseContentState } from "./content-state";

describe("parseContentState", () => {
  it("passes through the two non-default states", () => {
    expect(parseContentState("archived")).toBe("archived");
    expect(parseContentState("trash")).toBe("trash");
  });

  it("defaults to active for anything else", () => {
    expect(parseContentState("active")).toBe("active");
    expect(parseContentState(null)).toBe("active");
    expect(parseContentState(undefined)).toBe("active");
    expect(parseContentState("bogus")).toBe("active");
  });
});
