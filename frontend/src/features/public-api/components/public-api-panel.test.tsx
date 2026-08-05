import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicApiPanel } from "./public-api-panel";

function mockFetchSequence(
  ...responses: Array<{ ok: boolean; body?: unknown }>
) {
  const fn = vi.fn();
  responses.forEach((r) =>
    fn.mockResolvedValueOnce({ ok: r.ok, json: async () => r.body }),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("PublicApiPanel", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the keyed endpoint URL and a Swagger link", async () => {
    mockFetchSequence({ ok: true, body: [] });
    render(<PublicApiPanel baseUrl="https://api.example.com" />);

    expect(
      screen.getByText("https://api.example.com/public/portfolio"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API docs/i })).toHaveAttribute(
      "href",
      "https://api.example.com/api-docs",
    );
  });

  it("documents the x-api-key header", async () => {
    mockFetchSequence({ ok: true, body: [] });
    render(<PublicApiPanel baseUrl="https://api.example.com" />);
    expect(screen.getAllByText(/x-api-key/i).length).toBeGreaterThan(0);
  });

  it("reveals a freshly generated key exactly once", async () => {
    const fetchMock = mockFetchSequence(
      { ok: true, body: [] }, // initial list
      {
        ok: true,
        body: {
          id: 1,
          key: "pk_secret123",
          key_prefix: "pk_secret1",
          label: "site",
          created_at: "2026-08-04",
        },
      }, // POST create
      {
        ok: true,
        body: [
          {
            id: 1,
            label: "site",
            key_prefix: "pk_secret1",
            created_at: "2026-08-04",
            last_used_at: null,
            revoked_at: null,
          },
        ],
      }, // reload
    );

    render(<PublicApiPanel baseUrl="https://api.example.com" />);
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: "site" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(await screen.findByText("pk_secret123")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/api-keys",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("revokes a key via the BFF", async () => {
    const fetchMock = mockFetchSequence(
      {
        ok: true,
        body: [
          {
            id: 9,
            label: "old",
            key_prefix: "pk_old1234",
            created_at: "2026-08-04",
            last_used_at: null,
            revoked_at: null,
          },
        ],
      }, // initial list
      { ok: true, body: { id: 9 } }, // DELETE
      { ok: true, body: [] }, // reload
    );

    render(<PublicApiPanel baseUrl="https://api.example.com" />);
    fireEvent.click(await screen.findByRole("button", { name: /revoke/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/api-keys/9", {
        method: "DELETE",
      }),
    );
  });
});
