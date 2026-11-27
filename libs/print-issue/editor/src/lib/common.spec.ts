import { PrintIssueStatus } from '@wepublish/editor/api';
import { actorName, flowKind, nextIssue } from './common';

describe('nextIssue', () => {
  it('suggests the next number of the latest year, whatever the order and status', () => {
    expect(
      nextIssue([
        { number: 6, year: 2026 },
        { number: 3, year: 2027 },
        { number: 1, year: 2027 },
        { number: 4, year: 2026 },
      ])
    ).toEqual({ number: 4, year: 2027 });
  });

  it('continues after the last number of a double issue', () => {
    expect(
      nextIssue([
        { number: 3, numberTo: 4, year: 2027 },
        { number: 2, numberTo: null, year: 2027 },
      ])
    ).toEqual({ number: 5, year: 2027 });
  });

  it('starts a medium without issues at 1 of the current year', () => {
    expect(nextIssue([])).toEqual({
      number: 1,
      year: new Date().getFullYear(),
    });
  });

  it('continues after the highest number of any year where numbers run on', () => {
    const issues = [
      { number: 2, year: 2030 },
      { number: 116, numberTo: 117, year: 2029 },
    ];

    // per year this would be 3 of 2030
    expect(nextIssue(issues, 'continuous')).toEqual({
      number: 118,
      year: new Date().getFullYear(),
    });
    expect(nextIssue(issues)).toEqual({ number: 3, year: 2030 });
  });
});

describe('flowKind', () => {
  const draft = { id: 'd', batch: 0, deliveredAt: null };
  const delivered = {
    id: 'd',
    batch: 0,
    deliveredAt: '2026-12-21T09:00:00.000Z',
  };

  it('creates the first Druckliste while there is none', () => {
    expect(flowKind({ status: PrintIssueStatus.Open, deliveries: [] })).toBe(
      'create'
    );
  });

  it('edits the Druckliste while the only row is a draft', () => {
    expect(
      flowKind({ status: PrintIssueStatus.Open, deliveries: [draft] })
    ).toBe('editFirst');
  });

  it('edits the last Nachlieferung while it is a draft', () => {
    expect(
      flowKind({
        status: PrintIssueStatus.Open,
        deliveries: [delivered, { id: 'n', batch: 1, deliveredAt: null }],
      })
    ).toBe('editSupplement');
  });

  it('adds a Nachlieferung once every row is delivered', () => {
    expect(
      flowKind({ status: PrintIssueStatus.Open, deliveries: [delivered] })
    ).toBe('supplement');
  });

  it('offers nothing on a closed or historic issue', () => {
    expect(
      flowKind({ status: PrintIssueStatus.Closed, deliveries: [delivered] })
    ).toBeNull();
    expect(
      flowKind({ status: PrintIssueStatus.Historic, deliveries: [] })
    ).toBeNull();
  });
});

describe('actorName', () => {
  const t = ((key: string, values?: { key?: string }) =>
    values?.key ? `${key}(${values.key})` : key) as never;

  it('is the person‘s name', () => {
    expect(actorName(t, { firstName: 'Maria', name: 'Muster' })).toBe(
      'Maria Muster'
    );
  });

  it('adds the api key that did it on behalf of that person', () => {
    expect(
      actorName(t, { firstName: 'Maria', name: 'Muster' }, { name: 'Import' })
    ).toBe('Maria Muster · printIssues.viaApiKey(Import)');
  });

  it('still names the api key when the person is gone', () => {
    expect(actorName(t, null, { name: 'Import' })).toBe(
      'printIssues.viaApiKey(Import)'
    );
  });
});
