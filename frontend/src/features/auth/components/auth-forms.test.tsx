import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render-with-providers";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { VerificationForm } from "./verification-form";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

describe("authentication forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders accessible login fields", () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole("textbox", { name: "Email address" })).toBeVisible();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("redirects an unverified account to the verification screen", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 401,
          code: "EMAIL_NOT_VERIFIED",
          message: "Email is not verified",
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
    );
    renderWithProviders(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "owner@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith(
        "/verify-email?email=owner%40example.com",
      );
    });
  });

  it("displays every unmet password requirement", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Username"), "owner");
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "owner@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "password");
    await user.type(screen.getByLabelText("Confirm password"), "password");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Add one uppercase letter")).toBeVisible();
    expect(screen.getByText("Add one number")).toBeVisible();
    expect(screen.getByText("Add one special character")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts only a six-digit verification code", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerificationForm email="owner@example.com" />);

    const input = screen.getByRole("textbox", { name: "Verification code" });
    expect(input).toHaveAttribute("inputmode", "numeric");

    await user.type(input, "12345");
    await user.click(screen.getByRole("button", { name: "Verify Email" }));

    expect(
      await screen.findByText("Enter the six-digit code"),
    ).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("disables login submission while the request is pending", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "owner@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      screen.getByRole("button", { name: "Signing In..." }),
    ).toBeDisabled();
  });
});
