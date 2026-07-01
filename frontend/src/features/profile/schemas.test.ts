import { describe, expect, it } from "vitest";
import { profileSchema, passwordSchema } from "./schemas";

describe("profileSchema", () => {
  it("accepts an email with no username", () => {
    expect(profileSchema.safeParse({ email: "a@b.com", username: "" }).success).toBe(true);
  });

  it("accepts a valid username", () => {
    expect(profileSchema.safeParse({ email: "a@b.com", username: "jumael" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(profileSchema.safeParse({ email: "not-an-email", username: "" }).success).toBe(false);
  });

  it("rejects a username shorter than 6 characters", () => {
    expect(profileSchema.safeParse({ email: "a@b.com", username: "abcde" }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  const valid = {
    currentPassword: "OldPass1!",
    newPassword: "NewPass1!",
    confirmPassword: "NewPass1!",
  };

  it("accepts a valid password change", () => {
    expect(passwordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = passwordSchema.safeParse({ ...valid, confirmPassword: "Different1!" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("rejects a weak new password", () => {
    expect(passwordSchema.safeParse({ ...valid, newPassword: "weak", confirmPassword: "weak" }).success).toBe(false);
  });

  it("rejects a missing current password", () => {
    expect(passwordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });
});
