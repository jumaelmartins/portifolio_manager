import type { ReactNode } from "react";

export function SectionShell({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-12">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
