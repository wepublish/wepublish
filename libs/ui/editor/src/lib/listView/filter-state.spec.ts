import { clearFilters, countActiveFilters } from './filter-state';

describe('countActiveFilters', () => {
  it('counts nothing on an empty filter', () => {
    expect(countActiveFilters(['title', 'draft'], {})).toBe(0);
  });

  it('counts the fields the list actually offers', () => {
    expect(
      countActiveFilters(['title', 'draft'], { title: 'Hello', draft: true })
    ).toBe(2);
  });

  it('ignores a filter the list does not offer', () => {
    expect(countActiveFilters(['title'], { pollId: 'poll-1' })).toBe(0);
  });

  it('ignores a field that is set to nothing', () => {
    expect(
      countActiveFilters(['title', 'draft'], { title: '', draft: null })
    ).toBe(0);
  });

  it('counts a date range once', () => {
    expect(
      countActiveFilters(['publicationDate'], {
        publicationDateFrom: '2026-01-01',
        publicationDateTo: '2026-02-01',
      })
    ).toBe(1);
  });
});

describe('clearFilters', () => {
  it('empties the fields the list offers', () => {
    expect(
      clearFilters(['title', 'draft'], { title: 'Hello', draft: true })
    ).toEqual({});
  });

  it('keeps what the list did not put there', () => {
    expect(
      clearFilters(['title'], { title: 'Hello', pollId: 'poll-1' })
    ).toEqual({ pollId: 'poll-1' });
  });

  it('clears both ends of a date range', () => {
    expect(
      clearFilters(['publicationDate'], {
        publicationDateFrom: '2026-01-01',
        publicationDateTo: '2026-02-01',
      })
    ).toEqual({});
  });
});
