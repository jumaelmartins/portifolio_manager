import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExperienceSection } from "./experience-section";
import type { PublicExperience } from "../types";

const entry: PublicExperience = {
  id: 11,
  title: "Engineer",
  company: "Acme",
  description: "Built things",
  startDate: "2022-03-15",
  endDate: null,
};

describe("ExperienceSection", () => {
  it("renders title, company, description, and a 'Present' date range", () => {
    render(<ExperienceSection experience={[entry]} />);
    expect(screen.getByRole("heading", { name: "Experience" })).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Built things")).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it("renders nothing when empty", () => {
    const { container } = render(<ExperienceSection experience={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
