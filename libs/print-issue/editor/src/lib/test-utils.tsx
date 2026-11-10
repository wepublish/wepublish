import { createTheme, ThemeProvider } from '@mui/material';
import { render, type RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

const theme = createTheme({ cssVariables: true });

export const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value ?? '';

export const wrap = (element: ReactElement, path = '/') => (
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
  </ThemeProvider>
);

export const renderWithRouter = (
  element: ReactElement,
  path = '/'
): RenderResult => render(wrap(element, path));

export const user = { id: 'u1', name: 'Muster', firstName: 'Maria' };

export const options = (overrides: Record<string, unknown> = {}) => ({
  memberPlanIds: null,
  includeBexio: true,
  bexioKindIds: null,
  includeOpen: true,
  includeUpcoming: false,
  ...overrides,
});

export const summary = (overrides: Record<string, unknown> = {}) => ({
  issue: '1.27',
  date: '2027-01-15',
  includeUpcoming: false,
  rows: 100,
  copies: 102,
  bySource: { wepublish: 90, bexio: 10 },
  byPlan: [{ key: 'Jahresabo', count: 90 }],
  byKind: [{ key: 'Institutionelles Abo', count: 10 }],
  byCountry: [{ key: 'Schweiz', count: 100 }],
  unpaid: 3,
  openWithoutInvoice: 1,
  grace: 2,
  gifts: 0,
  kuendigungen: 1,
  missingAddress: 0,
  placeholderEmail: 0,
  duplicates: 0,
  alreadyExported: 0,
  totalSubscriptions: 120,
  skipped: {
    donation: 5,
    excludedPlan: 0,
    future: 1,
    unpaidDeactivation: 0,
    replaced: 0,
    deactivated: 10,
    lapsed: 4,
    exhausted: 0,
    noPrintIssues: 0,
  },
  bexio: {
    configured: true,
    included: true,
    path: 'search',
    invoicesInWindow: 50,
    canceled: 1,
    otherPeriod: 39,
    noValidPeriod: 0,
    skippedOpen: 0,
    excludedKind: 0,
    quantityMismatch: 0,
    skippedImported: 0,
    skippedProvider: 0,
    detailFetched: 0,
    ungeprueft: 0,
    zeroCopies: 0,
    contactMissing: 0,
  },
  warnings: [],
  ...overrides,
});

export const delivery = (overrides: Record<string, unknown> = {}) => ({
  id: 'del-0',
  batch: 0,
  createdAt: '2026-12-20T10:00:00.000Z',
  createdBy: user,
  options: options(),
  rowCount: 100,
  copyCount: 102,
  filename: 'druckliste-1.27-2027-01-15.csv',
  deliveredAt: null,
  deliveredBy: null,
  summary: summary(),
  ...overrides,
});

export const issue = (overrides: Record<string, unknown> = {}) => ({
  id: 'issue-1',
  createdAt: '2026-12-01T00:00:00.000Z',
  modifiedAt: '2026-12-01T00:00:00.000Z',
  number: 1,
  numberTo: null,
  year: 2027,
  label: '1.27',
  countsAs: 1,
  title: null,
  issueDate: '2027-01-15',
  status: 'open',
  note: null,
  options: options(),
  closedAt: null,
  closedBy: null,
  imageId: null,
  image: null,
  deliveries: [] as unknown[],
  ...overrides,
});

export const image = (overrides: Record<string, unknown> = {}) => ({
  id: 'img-1',
  title: 'Cover 1.27',
  squareURL: 'https://images.test/img-1/square.jpg',
  largeURL: 'https://images.test/img-1/large.jpg',
  ...overrides,
});

export const context = (overrides: Record<string, unknown> = {}) => ({
  bexioConfigured: true,
  defaults: options(),
  bexioKinds: [
    { id: 'gift', label: 'Geschenkabo', refersTo: 'period' },
    { id: 'single', label: 'Einzelheft', refersTo: 'issue' },
  ],
  ...overrides,
});

export const runRow = (name: string, extra: Record<string, unknown> = {}) => ({
  quelle: 'wepublish',
  adressnummer: '',
  anrede: '',
  firma: '',
  vorname: '',
  name,
  zusatz: '',
  strasse: 'Seestrasse',
  hausnummer: '5',
  plz: '8002',
  ort: 'Zürich',
  land: 'Schweiz',
  anzahl: 1,
  aboTyp: 'Jahresabo',
  zahlungsstatus: 'bezahlt bis 31.12.2027',
  beginn: '01.01.2024',
  email: '',
  bemerkungen: '',
  hinweis: '',
  ...extra,
});

export const storedRun = (overrides: Record<string, unknown> = {}) => ({
  mode: 'export',
  deliveryId: null,
  batch: 0,
  computedAt: '2026-12-20T09:00:00.000Z',
  computedBy: user,
  filename: 'druckliste-1.27-2027-01-15.csv',
  rows: [runRow('Alpha'), runRow('Beta')],
  summary: summary({ rows: 2, copies: 2, grace: 1, gifts: 0 }),
  ...overrides,
});
