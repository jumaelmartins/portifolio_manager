// frontend/src/app/(dashboard)/custom-sections/[id]/edit/page.tsx
import { SectionEditor } from "@/features/custom-sections/components/section-editor";

export default async function EditCustomSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sectionId = Number((await params).id);
  return <SectionEditor mode="edit" sectionId={sectionId} />;
}
