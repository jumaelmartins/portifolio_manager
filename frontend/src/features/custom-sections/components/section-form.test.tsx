import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionForm } from "./section-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("SectionForm", () => {
  it("blocks submission when the name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SectionForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create Section" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("appends a new field row when Add field is clicked", async () => {
    const user = userEvent.setup();
    render(<SectionForm {...baseProps} />);
    expect(screen.getAllByLabelText("Field label")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Add field" }));
    expect(screen.getAllByLabelText("Field label")).toHaveLength(2);
  });

  it("auto-populates the key from the label", async () => {
    const user = userEvent.setup();
    render(<SectionForm {...baseProps} />);
    await user.type(screen.getByLabelText("Field label"), "My Award");
    expect(screen.getByLabelText("Field key")).toHaveValue("my_award");
  });

  it("rejects an invalid key pattern on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SectionForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Section name"), "Awards");
    await user.type(screen.getByLabelText("Field label"), "Title");
    const keyInput = screen.getByLabelText("Field key");
    await user.clear(keyInput);
    await user.type(keyInput, "1bad");
    await user.click(screen.getByRole("button", { name: "Create Section" }));
    expect(
      await screen.findByText(/Key must start with a letter/),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<SectionForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Section name"), "Awards");
    await user.type(screen.getByLabelText("Field label"), "Title");
    await user.click(screen.getByRole("button", { name: "Create Section" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
