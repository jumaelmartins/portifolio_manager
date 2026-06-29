import { CourseEditor } from "@/features/courses/components/course-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const entryId = Number((await params).id);
  return <CourseEditor mode="edit" entryId={entryId} />;
}
