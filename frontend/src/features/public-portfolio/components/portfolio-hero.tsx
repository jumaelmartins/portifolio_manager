import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(username: string | null): string {
  if (!username) return "P";
  return username.slice(0, 2).toUpperCase();
}

export function PortfolioHero({
  username,
  role,
  avatarUrl,
}: {
  username: string | null;
  role: string;
  avatarUrl: string | null;
}) {
  return (
    <header className="flex flex-col items-center gap-4 py-16 text-center">
      <Avatar size="lg" className="size-24">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={username ?? "Portfolio"} /> : null}
        <AvatarFallback>{initials(username)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{username ?? "Portfolio"}</h1>
        <p className="text-muted-foreground">{role}</p>
      </div>
    </header>
  );
}
