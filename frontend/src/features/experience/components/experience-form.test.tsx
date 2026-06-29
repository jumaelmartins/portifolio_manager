import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExperienceForm } from "./experience-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("ExperienceForm", () => {
  it("blocks submission and shows errors when required fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExperienceForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create Experience" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires end date when not currently working here", async () => {
    const user = userEvent.setup();
    render(<ExperienceForm {...baseProps} />);
    await user.type(screen.getByLabelText("Job title"), "Engineer");
    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.type(screen.getByLabelText("Description"), "Some work");
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2022-01-01" },
    });
    await user.click(screen.getByRole("button", { name: "Create Experience" }));
    expect(
      await screen.findByText("End date is required when not currently working here"),
    ).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it("shows root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<ExperienceForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Job title"), "Engineer");
    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.type(screen.getByLabelText("Description"), "Some work");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2022-01-01" } });
    await user.click(screen.getByLabelText("Currently working here"));
    await user.click(screen.getByRole("button", { name: "Create Experience" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
