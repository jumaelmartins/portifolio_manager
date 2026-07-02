import { TechnologyEditor } from "@/features/technologies/components/technology-editor";

export default async function EditTechnologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const entryId = Number((await params).id);
  return <TechnologyEditor mode="edit" entryId={entryId} />;
}
