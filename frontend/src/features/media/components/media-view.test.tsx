import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("sonner", () => ({ toast }));

import { renderWithProviders } from "@/test/render-with-providers";
import type { MediaImage } from "../types";
import { MediaView } from "./media-view";

const images: MediaImage[] = [
  {
    id: 1,
    description: "Portfolio cover",
    url: "/api/uploads/file/1/cover.png",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    usage: { projects: [{ id: 7, title: "Portfolio" }], isProfilePicture: false },
  },
  {
    id: 2,
    description: null,
    url: "/api/uploads/file/1/unused.png",
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    usage: { projects: [], isProfilePicture: false },
  },
];

const baseProps = {
  images,
  isPending: false,
  error: null,
  onRetry: vi.fn(),
  onUpload: vi.fn(),
  onDelete: vi.fn(async () => {}),
  onUpdateDescription: vi.fn(async () => {}),
};

describe("MediaView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders each image with a usage badge", () => {
    renderWithProviders(<MediaView {...baseProps} />);
    expect(screen.getByText("Portfolio cover")).toBeInTheDocument();
    expect(screen.getByText(/1 project/i)).toBeInTheDocument();
    // Exact "Unused" (the usage badge). A loose /unused/i also matches the
    // "unused.png" filename badge that the filter test requires, so the loose
    // form is inherently ambiguous — narrowed to the badge's exact text.
    expect(screen.getByText("Unused")).toBeInTheDocument();
  });

  it("filters to unused images", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MediaView {...baseProps} />);

    await user.click(screen.getByRole("checkbox", { name: /unused only/i }));

    expect(screen.queryByText("Portfolio cover")).not.toBeInTheDocument();
    expect(screen.getByText("unused.png")).toBeInTheDocument();
  });

  it("searches by description", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MediaView {...baseProps} />);

    await user.type(screen.getByRole("searchbox"), "cover");

    expect(screen.getByText("Portfolio cover")).toBeInTheDocument();
    expect(screen.queryByText("unused.png")).not.toBeInTheDocument();
  });

  it("submits a description edit", async () => {
    const user = userEvent.setup();
    const onUpdateDescription = vi.fn(async () => {});
    renderWithProviders(
      <MediaView {...baseProps} onUpdateDescription={onUpdateDescription} />,
    );

    await user.click(
      screen.getAllByRole("button", { name: /edit description/i })[0],
    );
    const input = screen.getByRole("textbox", { name: /description/i });
    await user.clear(input);
    await user.type(input, "Renamed");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onUpdateDescription).toHaveBeenCalledWith(1, "Renamed");
  });

  it("surfaces the in-use message when a delete is rejected", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn(async () => {
      throw { status: 409, message: "Image is in use by 1 project(s)" };
    });
    renderWithProviders(<MediaView {...baseProps} onDelete={onDelete} />);

    await user.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    // confirm inside the dialog
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(toast.error).toHaveBeenCalledWith("Image is in use by 1 project(s)");
  });
});
