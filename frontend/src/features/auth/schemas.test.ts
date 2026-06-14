import { describe, expect, it } from "vitest";

import {
  loginSchema,
  registrationSchema,
  verificationSchema,
} from "./schemas";

describe("authentication schemas", () => {
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
