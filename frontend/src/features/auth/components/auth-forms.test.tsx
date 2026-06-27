import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render-with-providers";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { ResetPasswordForm } from "./reset-password-form";
import { VerificationForm } from "./verification-form";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

const mockSearchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => mockSearchParams,
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

  describe("ResetPasswordForm", () => {
    it("shows error state when no token is present in the URL", () => {
      mockSearchParams.get.mockReturnValue(null);
      renderWithProviders(<ResetPasswordForm />);

      expect(screen.getByText("Link inválido")).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Solicitar novo link" }),
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("validates password strength rules before submitting", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("valid-token");
      renderWithProviders(<ResetPasswordForm />);

      await user.type(screen.getByLabelText("Nova senha"), "weakpassword");
      await user.type(screen.getByLabelText("Confirmar senha"), "weakpassword");
      await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

      expect(await screen.findByText("Add one uppercase letter")).toBeVisible();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("submits { token, password } and redirects to /login?reset=success on success", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("abc123");
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      renderWithProviders(<ResetPasswordForm />);

      await user.type(screen.getByLabelText("Nova senha"), "StrongP@ss1");
      await user.type(screen.getByLabelText("Confirmar senha"), "StrongP@ss1");
      await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/reset-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "abc123", password: "StrongP@ss1" }),
        }),
      );
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith("/login?reset=success");
      });
    });

    it("shows invalid-token error state with link to /forgot-password on 400", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("expired-token");
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({ message: "Token expired or invalid" }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      );
      renderWithProviders(<ResetPasswordForm />);

      await user.type(screen.getByLabelText("Nova senha"), "StrongP@ss1");
      await user.type(screen.getByLabelText("Confirmar senha"), "StrongP@ss1");
      await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

      await screen.findByText("Link inválido");
      expect(
        screen.getByRole("link", { name: "Solicitar novo link" }),
      ).toBeVisible();
    });
  });

  describe("LoginForm (forgot-password link and reset-success banner)", () => {
    it("renders the forgot-password link pointing to /forgot-password", () => {
      renderWithProviders(<LoginForm />);

      expect(
        screen.getByRole("link", { name: "Forgot password?" }),
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("shows the reset-success banner when resetSuccess prop is true", () => {
      renderWithProviders(<LoginForm resetSuccess={true} />);

      expect(screen.getByRole("status")).toHaveTextContent(
        /Senha redefinida com sucesso/,
      );
    });

    it("does not show the reset-success banner by default", () => {
      renderWithProviders(<LoginForm />);

      expect(
        screen.queryByText(/Senha redefinida com sucesso/),
      ).not.toBeInTheDocument();
    });

    it("does not show the reset-success banner when resetSuccess is false", () => {
      renderWithProviders(<LoginForm resetSuccess={false} />);

      expect(
        screen.queryByText(/Senha redefinida com sucesso/),
      ).not.toBeInTheDocument();
    });
  });
});
