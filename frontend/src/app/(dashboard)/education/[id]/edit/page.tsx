import { EducationEditor } from "@/features/education/components/education-editor";

export default async function EditEducationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const entryId = Number((await params).id);
  return <EducationEditor mode="edit" entryId={entryId} />;
}
