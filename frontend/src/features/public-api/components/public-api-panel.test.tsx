import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicApiPanel } from "./public-api-panel";

describe("PublicApiPanel", () => {
  it("renders the owner endpoint URL and a Swagger link", () => {
    render(<PublicApiPanel userId="7" baseUrl="https://api.example.com" />);

    expect(
      screen.getByText("https://api.example.com/public/users/7"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API docs/i })).toHaveAttribute(
      "href",
      "https://api.example.com/api-docs",
    );
  });

  it("copies the endpoint URL to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<PublicApiPanel userId="7" baseUrl="https://api.example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(
      "https://api.example.com/public/users/7",
    );
  });

  it("shows a fallback when the user id is unavailable", () => {
    render(<PublicApiPanel userId={null} baseUrl="https://api.example.com" />);
    expect(
      screen.getByText(/could not determine your user id/i),
    ).toBeInTheDocument();
  });
});
