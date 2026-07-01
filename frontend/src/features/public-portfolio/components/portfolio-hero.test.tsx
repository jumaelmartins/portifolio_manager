import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioHero } from "./portfolio-hero";

describe("PortfolioHero", () => {
  it("renders the username and role", () => {
    render(<PortfolioHero username="jumael" role="OWNER" avatarUrl={null} />);
    expect(screen.getByRole("heading", { level: 1, name: "jumael" })).toBeInTheDocument();
    expect(screen.getByText("OWNER")).toBeInTheDocument();
  });

  it("falls back to 'Portfolio' when the username is null", () => {
    render(<PortfolioHero username={null} role="OWNER" avatarUrl={null} />);
    expect(screen.getByRole("heading", { level: 1, name: "Portfolio" })).toBeInTheDocument();
  });
});
