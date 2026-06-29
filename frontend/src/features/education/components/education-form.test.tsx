import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EducationForm } from "./education-form";

const baseProps = { mode: "create" as const, onSubmit: vi.fn() };

describe("EducationForm", () => {
  it("blocks submission when title is empty", async () => {
    const user = userEvent.setup();
    render(<EducationForm {...baseProps} onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create Education" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
  });

  it("requires end date when not currently studying", async () => {
    const user = userEvent.setup();
    render(<EducationForm {...baseProps} />);
    await user.type(screen.getByLabelText("Degree / title"), "BSc CS");
    await user.type(screen.getByLabelText("Institution"), "MIT");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2018-09-01" } });
    await user.click(screen.getByRole("button", { name: "Create Education" }));
    expect(
      await screen.findByText("End date is required when not currently studying here"),
    ).toBeInTheDocument();
  });
});
