import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentRowActions } from "./content-row-actions";

const noop = () => {};

function renderActions(state: "active" | "archived" | "trash", overrides = {}) {
  const handlers = {
    onArchive: vi.fn(),
    onUnarchive: vi.fn(),
    onRestore: vi.fn(),
    onSoftDelete: vi.fn(),
    onPurge: vi.fn(),
  };
  render(
    <ContentRowActions
      state={state}
      label="Widget"
      editHref="/widgets/1/edit"
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe("ContentRowActions", () => {
  it("active: edit, archive, move-to-trash", () => {
    const h = renderActions("active");
    expect(screen.getByRole("link", { name: "Edit Widget" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive Widget" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Widget to trash" }));
    expect(h.onArchive).toHaveBeenCalled();
    expect(h.onSoftDelete).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Restore Widget" })).toBeNull();
  });

  it("archived: edit, unarchive, move-to-trash", () => {
    const h = renderActions("archived");
    fireEvent.click(screen.getByRole("button", { name: "Unarchive Widget" }));
    expect(h.onUnarchive).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Edit Widget" })).toBeInTheDocument();
  });

  it("trash: restore + delete permanently, no edit", () => {
    const h = renderActions("trash");
    expect(screen.queryByRole("link", { name: "Edit Widget" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Restore Widget" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Widget permanently" }));
    expect(h.onRestore).toHaveBeenCalled();
    expect(h.onPurge).toHaveBeenCalled();
  });
});
