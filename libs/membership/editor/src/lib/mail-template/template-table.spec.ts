import { MailChannel, MailTemplateContext } from '@wepublish/editor/api';

import {
  DEFAULT_LAYOUT,
  filterTemplates,
  layoutOptions,
  NO_APPENDIX,
  pageOf,
  sortTemplates,
  TemplateRow,
} from './template-table';

const row = (overrides: Partial<TemplateRow> & { id: string }): TemplateRow =>
  ({
    name: overrides.id,
    description: null,
    subject: '',
    context: null,
    status: 'unused',
    channels: [MailChannel.Mail],
    letterLayoutName: null,
    letterAppendixName: null,
    memberPlans: [],
    ...overrides,
  }) as TemplateRow;

const welcome = row({
  id: 'welcome',
  name: 'Willkommen',
  description: 'Erste Mitteilung nach dem Abschluss',
  subject: 'Schön, dass du da bist',
  context: MailTemplateContext.Subscription,
  status: 'ok',
  channels: [MailChannel.Mail, MailChannel.Letter],
  letterLayoutName: 'Briefpapier Verlag',
  letterAppendixName: 'QR-Rechnung',
  memberPlans: [{ id: 'digital', name: 'Digital' }],
});

const invoice = row({
  id: 'invoice',
  name: 'Neue Rechnung',
  subject: 'Deine Rechnung',
  context: MailTemplateContext.InvoiceCreation,
  status: 'ok',
  channels: [MailChannel.Mail, MailChannel.Letter],
  memberPlans: [
    { id: 'digital', name: 'Digital' },
    { id: 'print', name: 'Print' },
  ],
});

const login = row({
  id: 'login',
  name: 'anmeldung',
  subject: 'Dein Login-Link',
  context: MailTemplateContext.Account,
});

const rows = [welcome, invoice, login];

const ids = (list: TemplateRow[]) => list.map(({ id }) => id);

const purposeLabel = (context: string) =>
  ({
    subscription: 'Abo-Abschluss',
    invoiceCreation: 'Rechnungserstellung',
    account: 'Konto',
  })[context] ?? context;

describe('filterTemplates', () => {
  it('keeps everything without a filter', () => {
    expect(filterTemplates(rows, {})).toEqual(rows);
  });

  it('searches name, description and subject, whatever the case', () => {
    expect(ids(filterTemplates(rows, { search: 'RECHNUNG' }))).toEqual([
      'invoice',
    ]);
    expect(ids(filterTemplates(rows, { search: 'abschluss' }))).toEqual([
      'welcome',
    ]);
    expect(ids(filterTemplates(rows, { search: 'login-link' }))).toEqual([
      'login',
    ]);
  });

  it('filters by purpose', () => {
    expect(
      ids(
        filterTemplates(rows, {
          purposes: [
            MailTemplateContext.Account,
            MailTemplateContext.Subscription,
          ],
        })
      )
    ).toEqual(['welcome', 'login']);
  });

  it('filters by a channel the template is written for', () => {
    expect(
      ids(filterTemplates(rows, { channels: [MailChannel.Letter] }))
    ).toEqual(['welcome', 'invoice']);
  });

  it('filters by status', () => {
    expect(ids(filterTemplates(rows, { statuses: ['unused'] }))).toEqual([
      'login',
    ]);
  });

  it('filters by stationery, the default one only among templates with a letter', () => {
    expect(
      ids(filterTemplates(rows, { layouts: ['Briefpapier Verlag'] }))
    ).toEqual(['welcome']);
    expect(ids(filterTemplates(rows, { layouts: [DEFAULT_LAYOUT] }))).toEqual([
      'invoice',
    ]);
  });

  it('filters by appendix, "none" only among templates with a letter', () => {
    expect(ids(filterTemplates(rows, { appendices: ['QR-Rechnung'] }))).toEqual(
      ['welcome']
    );
    expect(ids(filterTemplates(rows, { appendices: [NO_APPENDIX] }))).toEqual([
      'invoice',
    ]);
  });

  it('filters by a member plan whose flow sends the template', () => {
    expect(ids(filterTemplates(rows, { memberPlans: ['print'] }))).toEqual([
      'invoice',
    ]);
  });

  it('applies all filters together', () => {
    expect(
      ids(
        filterTemplates(rows, {
          channels: [MailChannel.Letter],
          memberPlans: ['digital'],
          search: 'willkommen',
        })
      )
    ).toEqual(['welcome']);
  });
});

describe('layoutOptions', () => {
  it('offers the stationery in use, and the default one when a letter uses it', () => {
    expect(layoutOptions(rows)).toEqual([DEFAULT_LAYOUT, 'Briefpapier Verlag']);
    expect(layoutOptions([welcome, login])).toEqual(['Briefpapier Verlag']);
  });
});

describe('sortTemplates', () => {
  const sorted = (field: string, order: 'asc' | 'desc' = 'asc') =>
    ids(
      sortTemplates(rows, field, order, {
        purpose: purposeLabel,
        defaultLayout: 'Standard',
      })
    );

  it('sorts by name without minding the case', () => {
    expect(sorted('name')).toEqual(['login', 'invoice', 'welcome']);
    expect(sorted('name', 'desc')).toEqual(['welcome', 'invoice', 'login']);
  });

  it('sorts the purpose by the label the table shows', () => {
    expect(sorted('context')).toEqual(['welcome', 'login', 'invoice']);
  });

  it('sorts by subject', () => {
    expect(sorted('subject')).toEqual(['login', 'invoice', 'welcome']);
  });

  it('puts used templates first when sorting by status', () => {
    expect(sorted('status')).toEqual(['invoice', 'welcome', 'login']);
    expect(sorted('status', 'desc')).toEqual(['login', 'invoice', 'welcome']);
  });

  it('sorts the stationery by what the table shows, the default one included', () => {
    // welcome: «Briefpapier Verlag», invoice: a letter on the default
    // stationery, shown as «Standard», login: no letter.
    expect(sorted('letterLayoutName')).toEqual(['welcome', 'invoice', 'login']);
    expect(sorted('letterLayoutName', 'desc')).toEqual([
      'login',
      'invoice',
      'welcome',
    ]);
  });

  it('puts rows without a value last, and first when the order is reversed', () => {
    expect(sorted('letterAppendixName')).toEqual([
      'welcome',
      'login',
      'invoice',
    ]);
    expect(sorted('letterAppendixName', 'desc')).toEqual([
      'login',
      'invoice',
      'welcome',
    ]);
    expect(sorted('description', 'desc')).toEqual([
      'login',
      'invoice',
      'welcome',
    ]);
  });

  it('leaves the list alone for a field it does not know', () => {
    expect(sorted('nope')).toEqual(ids(rows));
  });
});

describe('pageOf', () => {
  const list = ['a', 'b', 'c', 'd', 'e'];

  it('cuts out the page', () => {
    expect(pageOf(list, 1, 2)).toEqual({ page: 1, rows: ['a', 'b'] });
    expect(pageOf(list, 3, 2)).toEqual({ page: 3, rows: ['e'] });
  });

  it('falls back to the last page when a filter left fewer pages', () => {
    expect(pageOf(list, 9, 2)).toEqual({ page: 3, rows: ['e'] });
    expect(pageOf([], 4, 2)).toEqual({ page: 1, rows: [] });
  });
});
