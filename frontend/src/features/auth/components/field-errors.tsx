import type { FieldError } from "react-hook-form";

export function FieldErrors({
  error,
  id,
}: {
  error?: FieldError;
  id: string;
}) {
  if (!error) {
    return null;
  }

  const messages = error.types
    ? Object.values(error.types).flatMap((message) =>
        Array.isArray(message)
          ? message
          : typeof message === "string"
            ? [message]
            : [],
      )
    : error.message
      ? [error.message]
      : [];

  return (
    <div id={id} className="space-y-1 text-sm text-destructive" role="alert">
      {[...new Set(messages)].map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
