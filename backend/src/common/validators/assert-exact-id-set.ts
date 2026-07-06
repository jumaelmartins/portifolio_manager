import { BadRequestException } from '@nestjs/common';

/**
 * Asserts that `submittedIds` is exactly a permutation of `ownedIds`:
 * same length, every id owned, no duplicates. Used by reorder endpoints,
 * where the client always submits the resource's complete ordered id set.
 */
export function assertExactIdSet(
  ownedIds: number[],
  submittedIds: number[],
): void {
  const mismatch = new BadRequestException(
    'Reorder ids do not match the current set',
  );

  if (submittedIds.length !== ownedIds.length) {
    throw mismatch;
  }

  const owned = new Set(ownedIds);
  const seen = new Set<number>();

  for (const id of submittedIds) {
    if (seen.has(id) || !owned.has(id)) {
      throw mismatch;
    }
    seen.add(id);
  }
}
