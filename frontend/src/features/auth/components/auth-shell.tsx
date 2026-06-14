import {
  Code2,
  FolderKanban,
  GitBranch,
  Heart,
  LockKeyhole,
  Users,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const benefits = [
  {
    icon: FolderKanban,
    title: "Projects",
    description: "Organize and showcase your best work with polished pages.",
    color: "text-primary",
  },
  {
    icon: Code2,
    title: "Developer focused",
    description: "Manage technologies, links, media, and portfolio content.",
    color: "text-sky-400",
  },
  {
    icon: Users,
    title: "Open source",
    description: "Own your content and build your professional presence.",
    color: "text-violet-400",
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-[#05080c] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[1440px] overflow-hidden rounded-2xl border border-white/10 bg-[#080d12] shadow-2xl shadow-black/30 sm:min-h-[calc(100svh-3rem)] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col xl:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/3 size-[30rem] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgb(34_197_94_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(34_197_94_/_0.035)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,transparent,black_35%,transparent)]" />
          </div>

          <Image
            src="/brand/logo-lockup.svg"
            alt="Portfolio Manager"
            width={320}
            height={80}
            priority
            className="relative h-auto w-[280px]"
          />

          <div className="relative my-auto max-w-xl py-12">
            <h1 className="max-w-lg text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">
              Manage your professional portfolio{" "}
              <span className="text-primary">with confidence</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground xl:text-lg">
              Open-source CMS for developers to build, manage, and showcase
              projects, skills, and achievements.
            </p>

            <div className="mt-10 space-y-5">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.035]">
                    <benefit.icon
                      className={`size-5 ${benefit.color}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold">{benefit.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="relative flex items-center justify-between gap-4 border-t border-white/8 pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Heart className="size-4 fill-primary text-primary" />
              Open-source CMS for developers
            </span>
            <span className="flex items-center gap-2">
              <GitBranch className="size-4" />
              Build in public
            </span>
          </footer>
        </section>

        <section className="relative flex items-center justify-center p-4 sm:p-8 lg:p-10 xl:p-12">
          <div
            className="pointer-events-none absolute inset-x-1/4 top-0 h-40 rounded-full bg-primary/5 blur-[90px]"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[560px]">
            <div className="rounded-2xl border border-white/12 bg-[#0d141b]/95 p-6 shadow-2xl shadow-black/25 sm:p-9">
              {children}
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              Session tokens stay protected in secure HttpOnly cookies.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
