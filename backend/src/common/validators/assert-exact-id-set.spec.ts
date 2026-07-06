import { BadRequestException } from '@nestjs/common';
import { assertExactIdSet } from './assert-exact-id-set';

describe('assertExactIdSet', () => {
  it('passes when the submitted ids are the same set in the same order', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 3])).not.toThrow();
  });

  it('passes when the submitted ids are the same set in a different order', () => {
    expect(() => assertExactIdSet([1, 2, 3], [3, 1, 2])).not.toThrow();
  });

  it('throws when an owned id is missing from the submission', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2])).toThrow(
      BadRequestException,
    );
  });

  it('throws when the submission contains an id the user does not own', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 999])).toThrow(
      BadRequestException,
    );
  });

  it('throws when the submission contains a duplicate id', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 2])).toThrow(
      BadRequestException,
    );
  });

  it('throws when the lengths differ', () => {
    expect(() => assertExactIdSet([1, 2, 3], [1, 2, 3, 4])).toThrow(
      BadRequestException,
    );
  });
});
