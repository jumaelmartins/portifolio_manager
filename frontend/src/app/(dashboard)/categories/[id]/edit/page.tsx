import { CategoryEditor } from "@/features/categories/components/category-editor";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const entryId = Number((await params).id);
  return <CategoryEditor mode="edit" entryId={entryId} />;
}
