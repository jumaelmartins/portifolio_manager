import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomSections } from "./custom-sections";
import type { PublicCustomSection } from "../types";

const section: PublicCustomSection = {
  id: 41,
  name: "Certifications",
  description: "My certs",
  icon: null,
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "link", label: "Link", type: "url" },
    { key: "earned", label: "Earned", type: "date" },
    { key: "note", label: "Note", type: "text" },
  ],
  items: [{ id: 51, data: { name: "AWS SAA", link: "https://cert/aws", earned: "2022-03-15" } }],
};

describe("CustomSections", () => {
  it("renders the section name, description, and field labels", () => {
    render(<CustomSections sections={[section]} />);
    expect(screen.getByRole("heading", { name: "Certifications" })).toBeInTheDocument();
    expect(screen.getByText("My certs")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("AWS SAA")).toBeInTheDocument();
  });

  it("renders url fields as external links", () => {
    render(<CustomSections sections={[section]} />);
    const link = screen.getByRole("link", { name: "https://cert/aws" });
    expect(link).toHaveAttribute("href", "https://cert/aws");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("formats date fields", () => {
    render(<CustomSections sections={[section]} />);
    expect(screen.getByText(/2022/)).toBeInTheDocument();
  });

  it("skips fields whose value is missing or empty", () => {
    render(<CustomSections sections={[section]} />);
    // "note" has no value in the item data, so its label must not appear
    expect(screen.queryByText("Note")).toBeNull();
  });

  it("renders nothing when there are no sections", () => {
    const { container } = render(<CustomSections sections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
