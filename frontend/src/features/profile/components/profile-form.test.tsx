import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

const baseProps = {
  defaultValues: { email: "user@example.com", username: "jumael" },
  onSubmit: vi.fn(),
};

describe("ProfileForm", () => {
  it("blocks submission when the email is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProfileForm {...baseProps} defaultValues={{ email: "", username: "" }} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission on an invalid email format", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProfileForm {...baseProps} onSubmit={onSubmit} />);
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Must be a valid email address")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a root error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: "Server error" });
    render(<ProfileForm {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });
});
