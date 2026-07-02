import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoursesSection } from "@/features/public-portfolio/components/courses-section";
import { CustomSections } from "@/features/public-portfolio/components/custom-sections";
import { EducationSection } from "@/features/public-portfolio/components/education-section";
import { ExperienceSection } from "@/features/public-portfolio/components/experience-section";
import { PortfolioHero } from "@/features/public-portfolio/components/portfolio-hero";
import { PortfolioNav, type NavItem } from "@/features/public-portfolio/components/portfolio-nav";
import { ProjectsSection } from "@/features/public-portfolio/components/projects-section";
import { getPublicPortfolio } from "@/features/public-portfolio/server/get-portfolio";
import { buildPortfolioMetadata } from "@/features/public-portfolio/server/metadata";

type PageProps = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const portfolio = await getPublicPortfolio(userId);
  return buildPortfolioMetadata(portfolio, userId);
}

export default async function PortfolioPage({ params }: PageProps) {
  const { userId } = await params;
  const portfolio = await getPublicPortfolio(userId);
  if (!portfolio) notFound();

  const navItems: NavItem[] = [
    portfolio.projects.length ? { id: "projects", label: "Projects" } : null,
    portfolio.experience.length ? { id: "experience", label: "Experience" } : null,
    portfolio.education.length ? { id: "education", label: "Education" } : null,
    portfolio.courses.length ? { id: "courses", label: "Courses" } : null,
    ...portfolio.customSections.map((s) => ({ id: `section-${s.id}`, label: s.name })),
  ].filter((item): item is NavItem => item !== null);

  return (
    <div className="mx-auto max-w-4xl px-4">
      <PortfolioHero
        username={portfolio.username}
        role={portfolio.role}
        avatarUrl={portfolio.avatarUrl}
      />
      <PortfolioNav items={navItems} />
      <ProjectsSection projects={portfolio.projects} />
      <ExperienceSection experience={portfolio.experience} />
      <EducationSection education={portfolio.education} />
      <CoursesSection courses={portfolio.courses} />
      <CustomSections sections={portfolio.customSections} />
    </div>
  );
}
