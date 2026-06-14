"use client";

import { GitBranch, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { navigationGroups } from "./navigation";

export function NavigationGroups({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6" aria-label="Main navigation">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                item.href &&
                (pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`)));
              const content = (
                <>
                  <item.icon className="size-[18px]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.disabled ? (
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-md px-1.5 text-[10px] font-medium text-muted-foreground"
                    >
                      Soon
                    </Badge>
                  ) : null}
                </>
              );

              return (
                <li key={item.label}>
                  {item.href && !item.disabled ? (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active &&
                          "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
                      )}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      aria-disabled="true"
                      className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground/55"
                    >
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-20 items-center border-b border-sidebar-border px-5">
        <Image
          src="/brand/logo-lockup.svg"
          alt="Portfolio Manager"
          width={220}
          height={56}
          priority
          className="h-auto w-[210px]"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <NavigationGroups onNavigate={onNavigate} />
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Open-source portfolio CMS
          </div>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Built for developers who want full control of their portfolio.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="size-3.5" aria-hidden="true" />
            Build in public
          </div>
        </div>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarContent />
    </aside>
  );
}
