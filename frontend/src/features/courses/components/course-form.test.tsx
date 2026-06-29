import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CourseForm } from "./course-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("CourseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks submission when title is empty", async () => {
    const user = userEvent.setup();
    render(<CourseForm {...baseProps} onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create Course" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
  });

  it("requires end date when not currently enrolled", async () => {
    const user = userEvent.setup();
    render(<CourseForm {...baseProps} />);
    await user.type(screen.getByLabelText("Course title"), "AWS SA");
    await user.type(screen.getByLabelText("Institution"), "Amazon");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2023-03-01" } });
    await user.click(screen.getByRole("button", { name: "Create Course" }));
    expect(
      await screen.findByText("End date is required when not currently enrolled"),
    ).toBeInTheDocument();
  });

  it("shows root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<CourseForm mode="create" onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Course title"), "AWS SA");
    await user.type(screen.getByLabelText("Institution"), "Amazon");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2023-03-01" } });
    await user.click(screen.getByLabelText("Currently enrolled"));
    await user.click(screen.getByRole("button", { name: "Create Course" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
