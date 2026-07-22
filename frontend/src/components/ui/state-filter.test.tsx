import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StateFilter } from "./state-filter";

describe("StateFilter", () => {
  it("renders three tabs and marks the active one selected", () => {
    render(<StateFilter value="archived" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Archived" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Trash" })).toHaveAttribute("aria-selected", "false");
  });

  it("emits the clicked state", () => {
    const onChange = vi.fn();
    render(<StateFilter value="active" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Trash" }));
    expect(onChange).toHaveBeenCalledWith("trash");
  });
});
