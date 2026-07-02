import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionShell } from "./section-shell";

describe("SectionShell", () => {
  it("renders a titled section with the given anchor id and children", () => {
    const { container } = render(
      <SectionShell id="projects" title="Projects">
        <p>content</p>
      </SectionShell>,
    );
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(container.querySelector("section#projects")).not.toBeNull();
  });
});
