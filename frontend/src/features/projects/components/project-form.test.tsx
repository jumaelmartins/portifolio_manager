import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectForm } from "./project-form";

const baseProps = {
  mode: "create" as const,
  categories: [{ id: 1, name: "Full Stack" }],
  technologies: [
    { id: 2, name: "TypeScript" },
    { id: 3, name: "PostgreSQL" },
  ],
  images: [],
  onSubmit: vi.fn(),
  onUpload: vi.fn(),
};

describe("ProjectForm", () => {
  it("blocks submission when title and description are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ProjectForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(
      await screen.findByText("Description is required"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits unique numeric technology IDs", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ProjectForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "Portfolio Manager");
    await user.type(screen.getByLabelText("Description"), "Open-source CMS");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("combobox", { name: "Technologies" }));
    await user.click(screen.getByRole("option", { name: "TypeScript" }));
    await user.click(screen.getByRole("option", { name: "PostgreSQL" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        technologyIds: [2, 3],
      }),
    );
  });

  it("rejects a 6 MB image before upload", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const oversized = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "large.png",
      { type: "image/png" },
    );

    render(<ProjectForm {...baseProps} onUpload={onUpload} />);
    await user.upload(screen.getByLabelText("Upload image"), oversized);

    expect(
      await screen.findByText("Image must be 5 MB or smaller"),
    ).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uploads a valid PNG and selects it as the cover", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockResolvedValue({
      id: 9,
      description: "cover.png",
      url: "https://example.com/cover.png",
      createdAt: "2026-06-14T00:00:00.000Z",
      updatedAt: "2026-06-14T00:00:00.000Z",
    });
    const file = new File([new Uint8Array([137, 80, 78, 71])], "cover.png", {
      type: "image/png",
    });

    render(<ProjectForm {...baseProps} onUpload={onUpload} />);
    await user.upload(screen.getByLabelText("Upload image"), file);

    expect(onUpload).toHaveBeenCalledWith(file);
    expect(await screen.findByText("cover.png")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select cover.png" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("preserves entered values and relationships after an API failure", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({
      message: "Project already exists",
    });

    render(<ProjectForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "Portfolio Manager");
    await user.type(screen.getByLabelText("Description"), "Open-source CMS");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("combobox", { name: "Technologies" }));
    await user.click(screen.getByRole("option", { name: "TypeScript" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Project already exists",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Portfolio Manager");
    expect(screen.getByLabelText("Description")).toHaveValue("Open-source CMS");
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });
});
