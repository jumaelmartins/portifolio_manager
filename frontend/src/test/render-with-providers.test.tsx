import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "./render-with-providers";

describe("renderWithProviders", () => {
  it("renders children inside the application providers", () => {
    renderWithProviders(<p>provider ready</p>);
    expect(screen.getByText("provider ready")).toBeInTheDocument();
  });
});
