import { fuzzySearch } from './fuzzySearch';

type Item = { name: string; group?: string; tags?: string[] };

const search = (items: Item[], query: string) =>
  fuzzySearch(items, query, item => ({
    title: item.name,
    section: item.group,
    keywords: item.tags,
  })).map(({ item }) => item.name);

describe('fuzzySearch', () => {
  it('keeps every item, in order, for an empty query', () => {
    expect(search([{ name: 'B' }, { name: 'A' }], ' ')).toEqual(['B', 'A']);
  });

  it('finds items by any of their keywords', () => {
    expect(
      search(
        [
          { name: 'Payments', tags: ['Stripe', 'Payrexx'] },
          { name: 'Spam protection', tags: ['hCaptcha'] },
        ],
        'strp'
      )
    ).toEqual(['Payments']);
  });

  it('finds items by their section', () => {
    expect(
      search(
        [
          { name: 'Transactional email', group: 'Email' },
          { name: 'Payments', group: 'Payments' },
        ],
        'email'
      )
    ).toEqual(['Transactional email']);
  });

  it('ranks a title match above a keyword match', () => {
    expect(
      search(
        [
          { name: 'Payments', tags: ['Mailchimp'] },
          { name: 'Mailchimp audience' },
        ],
        'mailchimp'
      )
    ).toEqual(['Mailchimp audience', 'Payments']);
  });

  it('marks the matched characters of the title', () => {
    expect(
      fuzzySearch([{ name: 'Payments' }], 'pay', item => ({
        title: item.name,
      }))[0].indices
    ).toEqual([0, 1, 2]);
  });
});
