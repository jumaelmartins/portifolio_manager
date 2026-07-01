export function isDataObject(value: unknown): value is { data: Record<string, unknown> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { data: unknown }).data === "object" &&
    (value as { data: unknown }).data !== null &&
    !Array.isArray((value as { data: unknown }).data)
  );
}
