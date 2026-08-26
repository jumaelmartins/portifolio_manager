import { describe, expect, it } from "vitest";
import { navigationGroups } from "./navigation";

describe("navigationGroups", () => {
  it("exposes an enabled Media link", () => {
    const media = navigationGroups
      .flatMap((group) => group.items)
      .find((item) => item.label === "Media");

    expect(media?.href).toBe("/media");
    expect(media?.disabled).toBeUndefined();
  });
});
