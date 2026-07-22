export type ContentState = "active" | "archived" | "trash";

export const CONTENT_STATES: ContentState[] = ["active", "archived", "trash"];

export function parseContentState(raw: string | null | undefined): ContentState {
  return raw === "archived" || raw === "trash" ? raw : "active";
}
