import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  registrationSchema,
  resetPasswordSchema,
  verificationSchema,
} from "./schemas";

describe("authentication schemas", () => {
  it("accepts a valid forgot password email", () => {
    expect(
      forgotPasswordSchema.safeParse({
        email: "jumael@example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid email in forgot password", () => {
    expect(
      forgotPasswordSchema.safeParse({
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched passwords in reset password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss2",
    });

    expect(result.success).toBe(false);
  });

  it("accepts matching valid passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password without uppercase, number, and special character", () => {
    const result = registrationSchema.safeParse({
      username: "jumael",
      email: "jumael@example.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({
        email: "jumael@example.com",
        password: "StrongP@ss1",
      }).success,
    ).toBe(true);
  });

  it("requires exactly six digits for verification", () => {
    expect(verificationSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(verificationSchema.safeParse({ code: "12345" }).success).toBe(false);
  });
});
