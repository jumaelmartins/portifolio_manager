import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PasswordForm } from "./password-form";

const baseProps = { onSubmit: vi.fn() };

describe("PasswordForm", () => {
  it("blocks submission when confirmation does not match", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasswordForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Current password"), "OldPass1!");
    await user.type(screen.getByLabelText("New password"), "NewPass1!");
    await user.type(screen.getByLabelText("Confirm new password"), "Different1!");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission when the new password is too weak", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasswordForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Current password"), "OldPass1!");
    await user.type(screen.getByLabelText("New password"), "weak");
    await user.type(screen.getByLabelText("Confirm new password"), "weak");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Current password is incorrect" });
    render(<PasswordForm {...baseProps} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Current password"), "WrongPass1!");
    await user.type(screen.getByLabelText("New password"), "NewPass1!");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPass1!");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect");
  });
});
