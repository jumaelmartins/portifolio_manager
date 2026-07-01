import {
  Blocks,
  BookOpen,
  Briefcase,
  CircleHelp,
  Code2,
  FolderKanban,
  Globe,
  GraduationCap,
  History,
  ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Map,
  Settings,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  disabled?: boolean;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Projects", icon: FolderKanban, href: "/projects" },
      { label: "Experience", icon: Briefcase, href: "/experience" },
      { label: "Education", icon: GraduationCap, href: "/education" },
      { label: "Courses", icon: BookOpen, href: "/courses" },
      { label: "Technologies", icon: Code2, disabled: true },
      { label: "Categories", icon: Tags, disabled: true },
      { label: "Custom Sections", icon: Blocks, href: "/custom-sections" },
      { label: "Media", icon: ImageIcon, disabled: true },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Roadmap", icon: Map, disabled: true },
      { label: "FAQ", icon: CircleHelp, disabled: true },
      { label: "Suggestions", icon: Lightbulb, disabled: true },
      { label: "Changelog", icon: History, disabled: true },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Public API", icon: Globe, disabled: true },
      { label: "Audit Logs", icon: ShieldCheck, disabled: true },
      { label: "Settings", icon: Settings, disabled: true },
    ],
  },
];
