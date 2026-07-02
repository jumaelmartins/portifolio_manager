import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectsSection } from "./projects-section";
import type { PublicProject } from "../types";

const base: PublicProject = {
  id: 5,
  title: "Alpha",
  description: "A cool project",
  repositoryUrl: "https://repo/alpha",
  liveUrl: "https://alpha.live",
  category: "Web",
  technologies: ["React", "NestJS"],
  coverUrl: "/api/uploads/file/1/alpha.png",
};

describe("ProjectsSection", () => {
  it("renders a project card with badges and links", () => {
    render(<ProjectsSection projects={[base]} />);
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByText("A cool project")).toBeInTheDocument();
    expect(screen.getByText("Web")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Repository" })).toHaveAttribute(
      "href",
      "https://repo/alpha",
    );
    expect(screen.getByRole("link", { name: "Live" })).toHaveAttribute(
      "href",
      "https://alpha.live",
    );
  });

  it("omits repo/live links when their URLs are null", () => {
    render(<ProjectsSection projects={[{ ...base, repositoryUrl: null, liveUrl: null }]} />);
    expect(screen.queryByRole("link", { name: "Repository" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Live" })).toBeNull();
  });

  it("renders nothing when there are no projects", () => {
    const { container } = render(<ProjectsSection projects={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
