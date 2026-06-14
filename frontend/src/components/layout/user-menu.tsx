"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/api/use-session";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = user?.username || user?.email || "Account";
  const role = user?.role_id === 1 ? "Admin" : "Member";

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-11 gap-3 px-2 sm:px-3"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar>
          <AvatarFallback className="bg-primary/15 font-semibold text-primary">
            {isLoading ? (
              <UserRound className="size-4" />
            ) : (
              initials(displayName) || "PM"
            )}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-36 truncate text-sm font-medium">
            {isLoading ? "Loading..." : displayName}
          </span>
          <span className="block text-xs text-muted-foreground">{role}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate text-sm text-foreground">
            {displayName}
          </span>
          <span className="mt-0.5 block truncate font-normal">
            {user?.email ?? "Session unavailable"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={signOut}
          disabled={signingOut}
          className="py-2"
        >
          <LogOut />
          {signingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
