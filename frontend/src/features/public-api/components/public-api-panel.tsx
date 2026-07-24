"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type PublicApiPanelProps = {
  userId: string | null;
  baseUrl: string;
};

export function PublicApiPanel({ userId, baseUrl }: PublicApiPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!userId) {
    return (
      <p className="text-sm text-muted-foreground">
        We could not determine your user id. Please sign out and back in.
      </p>
    );
  }

  const endpoint = `${baseUrl}/public/users/${userId}`;
  const docsUrl = `${baseUrl}/api-docs`;

  async function copy() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            onClick={copy}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Read-only, no authentication required, open to any origin. Returns
          your full portfolio (active items only) as JSON.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Example</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card/60 p-3 text-sm">
          <code>{`curl ${endpoint}

fetch("${endpoint}")
  .then((r) => r.json())
  .then(console.log);`}</code>
        </pre>
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
