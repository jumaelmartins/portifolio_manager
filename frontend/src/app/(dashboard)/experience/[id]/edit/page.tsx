import { ExperienceEditor } from "@/features/experience/components/experience-editor";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const entryId = Number((await params).id);
  return <ExperienceEditor mode="edit" entryId={entryId} />;
}
