import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EducationSection } from "./education-section";
import type { PublicEducation } from "../types";

const entry: PublicEducation = {
  id: 21,
  title: "BSc Computer Science",
  institution: "State University",
  description: "Studied CS",
  startDate: "2018-03-15",
  endDate: "2021-03-15",
};

describe("EducationSection", () => {
  it("renders the entry with its institution", () => {
    render(<EducationSection education={[entry]} />);
    expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
    expect(screen.getByText("BSc Computer Science")).toBeInTheDocument();
    expect(screen.getByText("State University")).toBeInTheDocument();
  });

  it("renders nothing when empty", () => {
    const { container } = render(<EducationSection education={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
