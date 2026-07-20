import { BadRequestException } from '@nestjs/common';

export type ContentState = 'active' | 'archived' | 'trash';

type StateWhere = {
  archived_at?: null | { not: null };
  deleted_at?: null | { not: null };
};

/**
 * Parses the `?state` query value. Defaults to 'active' (identical to the
 * pre-soft-delete behaviour); throws on any unknown value.
 */
export function parseContentState(raw?: string): ContentState {
  if (!raw) return 'active';
  if (raw === 'active' || raw === 'archived' || raw === 'trash') {
    return raw;
  }
  throw new BadRequestException(`Invalid state '${raw}'`);
}

/**
 * Prisma `where` fragment selecting rows in the given state. Column names are
 * shared by all six content tables, so the fragment is model-agnostic.
 */
export function contentStateWhere(state: ContentState): StateWhere {
  switch (state) {
    case 'archived':
      return { archived_at: { not: null }, deleted_at: null };
    case 'trash':
      return { deleted_at: { not: null } };
    case 'active':
    default:
      return { archived_at: null, deleted_at: null };
  }
}
