import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render-with-providers";
import { ForgotPasswordForm } from "./forgot-password-form";
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

  describe("ForgotPasswordForm", () => {
    it("renders the email field and submit button", () => {
      renderWithProviders(<ForgotPasswordForm />);

      expect(
        screen.getByRole("textbox", { name: "Email address" }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: /Enviar link de redefinição/i }),
      ).toBeVisible();
    });

    it("submits with correct payload and shows success state on 200", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(
        screen.getByRole("textbox", { name: "Email address" }),
        "user@example.com",
      );
      await user.click(
        screen.getByRole("button", { name: /Enviar link de redefinição/i }),
      );

      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
        }),
      );

      await screen.findByText(
        "Verifique sua caixa de entrada. Enviamos um link para redefinir sua senha.",
      );
    });

    it("shows Google-account error (400 with message) inline", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({ message: "This account uses Google Sign-In." }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      );
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(
        screen.getByRole("textbox", { name: "Email address" }),
        "user@example.com",
      );
      await user.click(
        screen.getByRole("button", { name: /Enviar link de redefinição/i }),
      );

      await screen.findByText("This account uses Google Sign-In.");
    });

    it("shows generic error on network failure", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
      renderWithProviders(<ForgotPasswordForm />);

      await user.type(
        screen.getByRole("textbox", { name: "Email address" }),
        "user@example.com",
      );
      await user.click(
        screen.getByRole("button", { name: /Enviar link de redefinição/i }),
      );

      await screen.findByText("Ocorreu um erro. Tente novamente.");
    });
  });
});
