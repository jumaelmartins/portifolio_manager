import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render-with-providers";
import { AdminShell } from "./admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/auth/api/use-session", () => ({
  useSession: () => ({
    data: {
      id: 7,
      username: "Lucas Oliveira",
      email: "lucas@example.com",
      role_id: 1,
    },
    isLoading: false,
  }),
}));

describe("AdminShell", () => {
  it("renders enabled navigation, future labels, and an accessible mobile menu", () => {
    renderWithProviders(
      <AdminShell>
        <p>Dashboard content</p>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getAllByText("Soon").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Open navigation menu" }),
    ).toBeInTheDocument();
  });

  it("opens the user menu with account details and sign out", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AdminShell>
        <p>Dashboard content</p>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: "Open user menu" }));

    expect(await screen.findByText("lucas@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Sign out" }),
    ).toBeInTheDocument();
  });
});
