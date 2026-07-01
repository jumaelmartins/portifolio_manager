import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CoursesSection } from "./courses-section";
import type { PublicCourse } from "../types";

const entry: PublicCourse = {
  id: 31,
  title: "Advanced React",
  institution: "Frontend Masters",
  description: "Deep dive",
  startDate: "2020-03-15",
  endDate: null,
};

describe("CoursesSection", () => {
  it("renders the entry with its institution", () => {
    render(<CoursesSection courses={[entry]} />);
    expect(screen.getByRole("heading", { name: "Courses" })).toBeInTheDocument();
    expect(screen.getByText("Advanced React")).toBeInTheDocument();
    expect(screen.getByText("Frontend Masters")).toBeInTheDocument();
  });

  it("renders nothing when empty", () => {
    const { container } = render(<CoursesSection courses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
