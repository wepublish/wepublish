import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  MailTemplateContext,
  MailTemplateListDocument,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';

import { SelectMailTemplatePanel } from './select-mail-template-panel';
import { useLetterChannel } from './use-letter-channel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('./use-letter-channel', () => ({ useLetterChannel: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // A string in second place is a fallback text, not values to fill in.
    t: (key: string, options?: Record<string, unknown> | string) =>
      options && typeof options === 'object' ?
        `${key}(${Object.values(options).join(',')})`
      : key,
    i18n: { language: 'en' },
  }),
}));

const template = (overrides: Record<string, unknown>) => ({
  id: String(overrides.name),
  name: 'Template',
  description: null,
  subject: '',
  context: null,
  status: 'ok',
  channels: ['mail'],
  attachmentIds: [],
  letterLayoutName: null,
  letterAppendixName: null,
  attachmentNames: [],
  memberPlans: [],
  ...overrides,
});

const templates = [
  template({
    name: 'Neue Rechnung',
    subject: 'Deine Rechnung',
    description: 'Mit Zahlschein',
    context: MailTemplateContext.InvoiceCreation,
    channels: ['mail', 'letter'],
    memberPlans: [{ id: 'print', name: 'Print' }],
  }),
  template({
    name: 'Mahnung',
    subject: 'Zahlungserinnerung',
    context: MailTemplateContext.InvoiceCreation,
  }),
  template({
    name: 'Willkommen',
    subject: 'Schön, dass du da bist',
    context: MailTemplateContext.Subscription,
    status: 'unused',
  }),
  // Written as a letter only: an event always sends the email.
  template({
    name: 'Begleitbrief',
    context: MailTemplateContext.InvoiceCreation,
    channels: ['letter'],
  }),
];

const onSelect = vi.fn();
const onClose = vi.fn();

const renderPanel = (
  props: Partial<Parameters<typeof SelectMailTemplatePanel>[0]> = {}
) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <SelectMailTemplatePanel
          eventLabel="Rechnungserstellung"
          onSelect={onSelect}
          onClose={onClose}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>
  );

const shownNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[0].textContent);

const rowOf = (name: string) =>
  screen
    .getAllByRole('row')
    .find(
      row => within(row).queryAllByRole('cell')[0]?.textContent === name
    ) as HTMLElement;

describe('SelectMailTemplatePanel', () => {
  beforeEach(() => {
    onSelect.mockReset();
    onClose.mockReset();
    (useQuery as unknown as Mock).mockReturnValue({
      data: { mailTemplates: templates },
      loading: false,
    });
    (useLetterChannel as unknown as Mock).mockReturnValue({
      paperLetters: true,
      letterAvailable: true,
    });
  });

  it('says which event the template is chosen for and loads the rows of the template table', () => {
    renderPanel();

    expect(
      screen.getByRole('heading', {
        name: 'mailTemplateSelect.chooser.title(Rechnungserstellung)',
      })
    ).toBeTruthy();
    expect(useQuery).toHaveBeenCalledWith(MailTemplateListDocument);
  });

  it('offers the templates with an email version, by name', () => {
    renderPanel();

    expect(shownNames()).toEqual(['Mahnung', 'Neue Rechnung', 'Willkommen']);
  });

  it('keeps the chosen template listed whatever versions it has', () => {
    renderPanel({ selectedId: 'Begleitbrief' });

    expect(shownNames()).toContain('Begleitbrief');
  });

  it('shows more than the name to choose by', () => {
    renderPanel();

    const row = rowOf('Neue Rechnung');

    expect(within(row).getByText('Deine Rechnung')).toBeTruthy();
    expect(within(row).getByText('Mit Zahlschein')).toBeTruthy();
    expect(within(row).getByText('Print')).toBeTruthy();
    expect(
      within(row).getByText('mailTemplates.mailTypes.invoiceCreation')
    ).toBeTruthy();
  });

  it('starts narrowed to the purpose of the event', () => {
    renderPanel({ purpose: MailTemplateContext.InvoiceCreation });

    expect(shownNames()).toEqual(['Mahnung', 'Neue Rechnung']);
  });

  it('shows everything again once the filters are reset', () => {
    renderPanel({ purpose: MailTemplateContext.InvoiceCreation });

    fireEvent.click(
      screen.getByRole('button', { name: 'filterableList.filter.reset' })
    );

    expect(shownNames()).toEqual(['Mahnung', 'Neue Rechnung', 'Willkommen']);
    expect(
      screen.queryByRole('button', { name: 'filterableList.filter.reset' })
    ).toBeNull();
  });

  it('searches name, description and subject without opening anything first', () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('mailTemplates.list.search'), {
      target: { value: 'erinnerung' },
    });

    expect(shownNames()).toEqual(['Mahnung']);
  });

  it('says when no template matches', () => {
    renderPanel({ purpose: MailTemplateContext.EmailChange });

    expect(screen.getByText('mailTemplates.list.noMatch')).toBeTruthy();
  });

  it('chooses a template with its button and closes', () => {
    renderPanel();

    fireEvent.click(
      within(rowOf('Mahnung')).getByRole('button', {
        name: 'mailTemplateSelect.chooser.select',
      })
    );

    expect(onSelect).toHaveBeenCalledWith('Mahnung');
    expect(onClose).toHaveBeenCalled();
  });

  it('chooses a template with a click on its row', () => {
    renderPanel();

    fireEvent.click(within(rowOf('Willkommen')).getByText('Willkommen'));

    expect(onSelect).toHaveBeenCalledWith('Willkommen');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('marks the template the event has now', () => {
    renderPanel({ selectedId: 'Mahnung' });

    expect(rowOf('Mahnung').className).toContain('highlighted-row');
    expect(rowOf('Willkommen').className).not.toContain('highlighted-row');
  });

  it('says on a row what a click on it does, like its button', () => {
    renderPanel({ selectedId: 'Mahnung' });

    expect(rowOf('Willkommen').getAttribute('title')).toBe(
      'mailTemplateSelect.chooser.select'
    );
    expect(
      within(rowOf('Willkommen')).getByRole('button', {
        name: 'mailTemplateSelect.chooser.select',
      })
    ).toBeTruthy();
  });

  it('says on the row and button of the current template that it is chosen already', () => {
    renderPanel({ selectedId: 'Mahnung' });

    expect(rowOf('Mahnung').getAttribute('title')).toBe(
      'mailTemplateSelect.chooser.selectCurrent'
    );
    expect(
      within(rowOf('Mahnung')).getByRole('button', {
        name: 'mailTemplateSelect.chooser.selectCurrent',
      })
    ).toBeTruthy();
  });

  it('keeps the pagination outside the part that scrolls', () => {
    renderPanel();

    const scrolling = screen.getByRole('table').closest('[data-table-area]');

    expect(scrolling).toBeTruthy();
    expect(
      scrolling?.contains(
        screen.getByRole('button', { name: 'listView.pagination.next' })
      )
    ).toBe(false);
  });

  it('lets the event send nothing, if it sends something now', () => {
    renderPanel({ selectedId: 'Mahnung' });

    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplateSelect.chooser.none' })
    );

    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not offer to send nothing for an event that sends nothing', () => {
    renderPanel();

    expect(
      screen.queryByRole('button', { name: 'mailTemplateSelect.chooser.none' })
    ).toBeNull();
  });

  it('opens a new template in another tab, so the page behind stays', () => {
    renderPanel();

    const link = screen.getByRole('link', {
      name: 'mailTemplateSelect.chooser.create',
    });

    expect(link.getAttribute('href')).toBe('/mailtemplates/create');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('leaves the letter columns and filters out where letters are not available', () => {
    (useLetterChannel as unknown as Mock).mockReturnValue({
      paperLetters: false,
      letterAvailable: false,
    });
    renderPanel();

    expect(
      screen.queryByRole('columnheader', {
        name: /mailTemplates.list.channels/,
      })
    ).toBeNull();
  });
});
