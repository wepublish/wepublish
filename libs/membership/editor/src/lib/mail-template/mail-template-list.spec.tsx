import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { MailTemplateList } from './mail-template-list';
import { useLetterChannel } from './use-letter-channel';

const template = (overrides: Record<string, unknown>) => ({
  id: String(overrides.name),
  name: 'Welcome',
  description: null,
  subject: 'Hello',
  context: null,
  status: 'ok',
  channels: ['mail'],
  letterLayoutName: null,
  letterAppendixName: null,
  memberPlans: [],
  attachmentNames: [],
  ...overrides,
});

const templates = [
  template({
    name: 'Welcome',
    subject: 'Zebra',
    channels: ['mail', 'letter'],
    letterLayoutName: 'Verlag',
    letterAppendixName: 'QR-Rechnung',
    memberPlans: [{ id: 'digital', name: 'Digital' }],
    attachmentNames: ['Zahlschein', 'AGB'],
  }),
  template({ name: 'Invoice', subject: 'Apple', status: 'unused' }),
  template({ name: 'Renewal', subject: 'Mango', channels: ['mail', 'letter'] }),
];

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

vi.mock('./use-letter-channel', () => ({ useLetterChannel: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderList = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MailTemplateList />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

const shownNames = () =>
  screen
    .getAllByRole('link')
    .map(link => link.textContent)
    .filter(
      name =>
        templates.some(row => row.name === name) || /^T\d+/.test(name ?? '')
    );

const header = (name: string) =>
  screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });

describe('MailTemplateList', () => {
  beforeEach(() => {
    window.localStorage.clear();
    (useQuery as unknown as Mock).mockReturnValue({
      data: { mailTemplates: templates },
      loading: false,
    });
    (useLetterChannel as unknown as Mock).mockReturnValue({
      paperLetters: true,
      letterAvailable: true,
    });
  });

  it('keeps the help next to the column header names', () => {
    renderList();

    for (const name of [
      'mailTemplates.edit.mailType',
      'mailTemplates.status',
    ]) {
      expect(
        within(header(name)).getByRole('button', { name: 'moreInfo' })
      ).toBeTruthy();
    }
  });

  it('says so when there are no templates', () => {
    (useQuery as unknown as Mock).mockReturnValue({
      data: { mailTemplates: [] },
      loading: false,
    });

    renderList();

    expect(screen.getByText('mailTemplates.empty')).toBeTruthy();
  });

  it('names the ok status in words', () => {
    renderList();

    expect(screen.getAllByRole('img', { name: 'ok' })).toHaveLength(2);
  });

  it('lists the templates by name, each linking to its edit view', () => {
    renderList();

    expect(shownNames()).toEqual(['Invoice', 'Renewal', 'Welcome']);
    expect(
      screen.getByRole('link', { name: 'Invoice' }).getAttribute('href')
    ).toBe('/mailtemplates/edit/Invoice');
  });

  it('sorts by the column whose header is clicked, and the other way on a second click', () => {
    renderList();

    const subject = within(header('mailTemplates.subject')).getByRole('button');

    fireEvent.click(subject);
    expect(shownNames()).toEqual(['Invoice', 'Renewal', 'Welcome']);

    fireEvent.click(
      within(header('mailTemplates.subject')).getByRole('button')
    );
    expect(shownNames()).toEqual(['Welcome', 'Renewal', 'Invoice']);
  });

  it('narrows the list while typing into the search field', () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    );
    fireEvent.change(screen.getByLabelText('mailTemplates.list.search'), {
      target: { value: 'mang' },
    });

    expect(shownNames()).toEqual(['Renewal']);
  });

  it('says that nothing matches instead of that there are no templates', () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    );
    fireEvent.change(screen.getByLabelText('mailTemplates.list.search'), {
      target: { value: 'nothing like this' },
    });

    expect(screen.getByText('mailTemplates.list.noMatch')).toBeTruthy();
    expect(screen.queryByText('mailTemplates.empty')).toBeNull();
  });

  it('shows what the letter is printed on and which plans send the template', () => {
    renderList();

    const row = screen.getByRole('link', { name: 'Welcome' }).closest('tr');

    if (!row) {
      throw new Error('no row');
    }

    expect(within(row).getByText('Verlag')).toBeTruthy();
    expect(within(row).getByText('QR-Rechnung')).toBeTruthy();
    expect(within(row).getByText('Digital')).toBeTruthy();
    expect(within(row).getByText('deliveryMode.channel.letter')).toBeTruthy();

    // A letter without stationery of its own is on the default one; a
    // template without a letter has none at all.
    const renewal = screen.getByRole('link', { name: 'Renewal' }).closest('tr');
    const invoice = screen.getByRole('link', { name: 'Invoice' }).closest('tr');

    expect(
      within(renewal as HTMLElement).getByText(
        'mailTemplates.list.letterLayoutDefault'
      )
    ).toBeTruthy();
    expect(
      within(invoice as HTMLElement).queryByText(
        'mailTemplates.list.letterLayoutDefault'
      )
    ).toBeNull();
  });

  it('lists the attachments of a template, with or without letters', () => {
    (useLetterChannel as unknown as Mock).mockReturnValue({
      paperLetters: false,
      letterAvailable: false,
    });

    renderList();

    const row = screen.getByRole('link', { name: 'Welcome' }).closest('tr');

    expect(
      within(row as HTMLElement).getByText('Zahlschein, AGB')
    ).toBeTruthy();
  });

  it('leaves the letter columns out where letters are not available', () => {
    (useLetterChannel as unknown as Mock).mockReturnValue({
      paperLetters: false,
      letterAvailable: false,
    });

    renderList();

    expect(
      screen.queryByRole('columnheader', {
        name: /mailTemplates.list.letterLayout/,
      })
    ).toBeNull();
    expect(
      screen.queryByRole('columnheader', {
        name: /mailTemplates.list.channels/,
      })
    ).toBeNull();
    expect(screen.queryByText('Verlag')).toBeNull();
  });

  it('pages through a long list', () => {
    (useQuery as unknown as Mock).mockReturnValue({
      data: {
        mailTemplates: Array.from({ length: 23 }, (_, index) =>
          template({ name: `T${String(index + 1).padStart(2, '0')}` })
        ),
      },
      loading: false,
    });

    renderList();

    expect(shownNames()).toHaveLength(20);
    expect(shownNames()[0]).toBe('T01');

    fireEvent.click(
      screen.getByRole('button', { name: 'listView.pagination.next' })
    );

    expect(shownNames()).toEqual(['T21', 'T22', 'T23']);
  });
});
