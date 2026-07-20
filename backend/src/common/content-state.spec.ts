import { BadRequestException } from '@nestjs/common';
import { parseContentState, contentStateWhere } from './content-state';

describe('content-state', () => {
  describe('parseContentState', () => {
    it('defaults to active when missing or empty', () => {
      expect(parseContentState(undefined)).toBe('active');
      expect(parseContentState('')).toBe('active');
    });

    it('accepts the three known states', () => {
      expect(parseContentState('active')).toBe('active');
      expect(parseContentState('archived')).toBe('archived');
      expect(parseContentState('trash')).toBe('trash');
    });

    it('rejects an unknown state', () => {
      expect(() => parseContentState('deleted')).toThrow(BadRequestException);
    });
  });

  describe('contentStateWhere', () => {
    it('active means both timestamps null', () => {
      expect(contentStateWhere('active')).toEqual({
        archived_at: null,
        deleted_at: null,
      });
    });

    it('archived means archived set and not trashed', () => {
      expect(contentStateWhere('archived')).toEqual({
        archived_at: { not: null },
        deleted_at: null,
      });
    });

    it('trash means deleted set (dominates)', () => {
      expect(contentStateWhere('trash')).toEqual({
        deleted_at: { not: null },
      });
    });
  });
});
