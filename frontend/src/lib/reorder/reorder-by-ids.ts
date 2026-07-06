export function reorderByIds<T extends { id: number; order?: number | null }>(
  items: T[],
  ids: number[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const result: T[] = [];
  ids.forEach((id) => {
    const item = byId.get(id);
    if (item) result.push({ ...item, order: result.length });
  });
  return result;
}
