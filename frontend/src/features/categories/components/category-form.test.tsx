import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CategoryForm } from "./category-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("CategoryForm", () => {
  it("blocks submission and shows an error when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create Category" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a trimmed name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CategoryForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Name"), "  Full Stack  ");
    await user.click(screen.getByRole("button", { name: "Create Category" }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Full Stack" });
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<CategoryForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Name"), "Frontend");
    await user.click(screen.getByRole("button", { name: "Create Category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
