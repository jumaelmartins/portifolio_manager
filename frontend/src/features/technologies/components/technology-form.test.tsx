import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TechnologyForm } from "./technology-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("TechnologyForm", () => {
  it("blocks submission and shows an error when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TechnologyForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create Technology" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a trimmed name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TechnologyForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Name"), "  TypeScript  ");
    await user.click(screen.getByRole("button", { name: "Create Technology" }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "TypeScript" });
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<TechnologyForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Name"), "React");
    await user.click(screen.getByRole("button", { name: "Create Technology" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
