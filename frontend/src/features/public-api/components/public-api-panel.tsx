"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ApiKey = {
  id: number;
  label: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

type PublicApiPanelProps = {
  baseUrl: string;
};

export function PublicApiPanel({ baseUrl }: PublicApiPanelProps) {
  const endpoint = `${baseUrl}/public/portfolio`;
  const docsUrl = `${baseUrl}/api-docs`;

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    const res = await fetch("/api/api-keys");
    if (res.ok) {
      setKeys((await res.json()) as ApiKey[]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load on mount; loadKeys resolves after an await and guards on res.ok, the standard data-fetching-in-effect pattern.
    void loadKeys();
  }, [loadKeys]);

  async function copyEndpoint() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function generate() {
    setError(null);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (!res.ok) {
      setError("Could not create the key. Check the label and try again.");
      return;
    }
    const created = (await res.json()) as { key: string };
    setNewKey(created.key);
    setLabel("");
    await loadKeys();
  }

  async function revoke(id: number) {
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadKeys();
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your public endpoint
        </h2>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-3">
          <code className="min-w-0 flex-1 truncate text-sm">{endpoint}</code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Copy endpoint URL"
            onClick={copyEndpoint}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Read-only. Requires an API key in the{" "}
          <code className="text-xs">x-api-key</code> header; the key resolves to
          its owner and returns that owner&apos;s full portfolio (active items
          only) as JSON.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Example</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card/60 p-3 text-sm">
          <code>{`curl -H "x-api-key: <your key>" ${endpoint}

fetch("${endpoint}", {
  headers: { "x-api-key": "<your key>" },
})
  .then((r) => r.json())
  .then(console.log);`}</code>
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">API keys</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-sm">
            <span className="text-muted-foreground">Label</span>
            <input
              type="text"
              value={label}
              maxLength={60}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. personal site"
              className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm"
            />
          </label>
          <Button type="button" onClick={generate} disabled={!label.trim()}>
            Generate key
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {newKey ? (
          <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="text-sm font-medium">
              Copy your key now — you won&apos;t see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate text-sm">{newKey}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Copy new key"
                onClick={() => navigator.clipboard.writeText(newKey)}
              >
                <Copy />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewKey(null)}
            >
              Done
            </Button>
          </div>
        ) : null}

        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {k.label}{" "}
                    <code className="text-xs text-muted-foreground">
                      {k.key_prefix}…
                    </code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {k.revoked_at
                      ? "Revoked"
                      : k.last_used_at
                        ? `Last used ${k.last_used_at}`
                        : "Never used"}
                  </p>
                </div>
                {k.revoked_at ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Revoke ${k.label}`}
                    onClick={() => revoke(k.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Full API reference:{" "}
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          API docs
        </a>
        .
      </p>
    </div>
  );
}
