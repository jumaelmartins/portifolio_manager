"use client";

import { ExternalLink, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MobileNavigation } from "./mobile-navigation";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <MobileNavigation />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className="relative hidden w-full max-w-sm md:block"
                tabIndex={0}
                aria-label="Global search is coming soon"
              />
            }
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search anything..."
              className="h-10 bg-muted/45 pl-9"
              disabled
            />
          </TooltipTrigger>
          <TooltipContent>Global search is coming soon</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="hidden h-10 gap-2 bg-muted/20 md:inline-flex"
          disabled
          aria-disabled="true"
        >
          <ExternalLink />
          View Public Site
          <Badge
            variant="secondary"
            className="h-5 rounded-md px-1.5 text-[10px]"
          >
            Soon
          </Badge>
        </Button>
        <div className="h-8 w-px bg-border" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  );
}
