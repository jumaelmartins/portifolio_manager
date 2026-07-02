// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
const { cookiesGet } = vi.hoisted(() => ({ cookiesGet: vi.fn() }));
const { decodeJwt } = vi.hoisted(() => ({ decodeJwt: vi.fn() }));

vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: cookiesGet })) }));
vi.mock("jose", () => ({ decodeJwt }));

import { revalidatePortfolio } from "./revalidate";

describe("revalidatePortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates the portfolio tag for the token subject", async () => {
    cookiesGet.mockReturnValue({ value: "jwt-token" });
    decodeJwt.mockReturnValue({ sub: "7" });

    await revalidatePortfolio();

    expect(decodeJwt).toHaveBeenCalledWith("jwt-token");
    expect(revalidateTag).toHaveBeenCalledWith("portfolio:7", "max");
  });

  it("is a no-op when there is no session cookie", async () => {
    cookiesGet.mockReturnValue(undefined);

    await revalidatePortfolio();

    expect(decodeJwt).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("is a no-op when the token has no subject", async () => {
    cookiesGet.mockReturnValue({ value: "jwt-token" });
    decodeJwt.mockReturnValue({});

    await revalidatePortfolio();

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
