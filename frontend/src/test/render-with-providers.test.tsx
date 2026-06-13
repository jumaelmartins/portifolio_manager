import { useQueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "./render-with-providers";

function CacheProbe() {
  const queryClient = useQueryClient();

  return (
    <p>{queryClient.getQueryData<string>(["provider-status"]) ?? "empty"}</p>
  );
}

describe("renderWithProviders", () => {
  it("preserves and exposes the query client across rerenders", () => {
    const result = renderWithProviders(<CacheProbe />);
    const initialQueryClient = result.queryClient;

    expect(screen.getByText("empty")).toBeInTheDocument();

    result.queryClient.setQueryData(["provider-status"], "provider ready");
    result.rerender(<CacheProbe />);

    expect(screen.getByText("provider ready")).toBeInTheDocument();
    expect(result.queryClient).toBe(initialQueryClient);
  });
});
