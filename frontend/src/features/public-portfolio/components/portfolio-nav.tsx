export type NavItem = { id: string; label: string };

export function PortfolioNav({ items }: { items: NavItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <ul className="flex flex-wrap gap-4 py-3 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
