import { ProjectEditor } from "@/features/projects/components/project-editor";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const projectId = Number((await params).id);
  return <ProjectEditor mode="edit" projectId={projectId} />;
}
