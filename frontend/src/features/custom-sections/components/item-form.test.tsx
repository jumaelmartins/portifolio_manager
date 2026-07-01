// frontend/src/features/custom-sections/components/item-form.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "./item-form";
import type { FieldSchema } from "../types";

const fields: FieldSchema[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "link", label: "Link", type: "url", required: false },
];

const baseProps = {
  fields,
  submitLabel: "Add Item",
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("ItemForm", () => {
  it("renders an input for each field in the schema", () => {
    render(<ItemForm {...baseProps} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Link")).toBeInTheDocument();
  });

  it("blocks submission when a required text field is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Add Item" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error when a url field is invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "Best Dev");
    await user.type(screen.getByLabelText("Link"), "not-a-url");
    await user.click(screen.getByRole("button", { name: "Add Item" }));
    expect(await screen.findByText("Must be a valid URL")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<ItemForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "Best Dev");
    await user.click(screen.getByRole("button", { name: "Add Item" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
