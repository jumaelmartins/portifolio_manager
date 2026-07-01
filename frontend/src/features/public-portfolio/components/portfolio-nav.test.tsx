import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioNav } from "./portfolio-nav";

describe("PortfolioNav", () => {
  it("renders anchor links for each item", () => {
    render(<PortfolioNav items={[{ id: "projects", label: "Projects" }]} />);
    const link = screen.getByRole("link", { name: "Projects" });
    expect(link).toHaveAttribute("href", "#projects");
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(<PortfolioNav items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
