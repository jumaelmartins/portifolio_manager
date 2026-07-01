import { describe, expect, it } from "vitest";
import { normalizeProfile } from "./normalize-profile";
import type { BackendProfileData } from "../types";

const backendUrl = "http://localhost:3000";

const base: BackendProfileData = {
  id: 7,
  email: "user@example.com",
  username: "jumael",
  images: [
    {
      id: 9,
      src_path: "uploads/7/avatar.png",
      f_userId: 7,
      description: null,
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
    },
  ],
  f_profile_picture: { id: 3, f_imagesId: 9 },
};

describe("normalizeProfile", () => {
  it("resolves the profile picture URL and rewrites it", () => {
    expect(normalizeProfile(base, backendUrl)).toEqual({
      id: 7,
      email: "user@example.com",
      username: "jumael",
      profilePicture: { id: 9, url: "/api/uploads/file/7/avatar.png" },
    });
  });

  it("returns null profilePicture when there is no join row", () => {
    expect(normalizeProfile({ ...base, f_profile_picture: null }, backendUrl).profilePicture).toBeNull();
  });

  it("returns null profilePicture when the referenced image is missing", () => {
    expect(
      normalizeProfile({ ...base, f_profile_picture: { id: 3, f_imagesId: 999 } }, backendUrl).profilePicture,
    ).toBeNull();
  });
});
