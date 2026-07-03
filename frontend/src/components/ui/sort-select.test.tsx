import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SortSelect } from "./sort-select";

const options = [
  { key: "recent", label: "Recent" },
  { key: "title-asc", label: "Title A–Z" },
];

describe("SortSelect", () => {
  it("reflects the active option label", () => {
    render(<SortSelect value="title-asc" options={options} onValueChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent(
      "Title A–Z",
    );
  });

  it("fires onValueChange when a new option is chosen", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SortSelect value="recent" options={options} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Title A–Z" }));
    expect(onValueChange).toHaveBeenCalledWith("title-asc");
  });
});
