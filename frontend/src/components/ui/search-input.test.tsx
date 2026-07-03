import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  it("renders the controlled value and placeholder", () => {
    render(
      <SearchInput value="hello" onChange={vi.fn()} placeholder="Search things..." />,
    );
    const box = screen.getByRole("searchbox");
    expect(box).toHaveValue("hello");
    expect(box).toHaveAttribute("placeholder", "Search things...");
  });

  it("fires onChange with the typed character", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
