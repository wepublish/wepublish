import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MailChannel, MailTemplateContext } from '@wepublish/editor/api';

import { MailTemplateField } from './mail-template-field';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The panel loads and lists the templates; here only what it is handed and
// what it hands back matters.
vi.mock('./select-mail-template-panel', () => ({
  SelectMailTemplatePanel: (props: {
    selectedId?: string | null;
    purpose?: string;
    eventLabel: string;
    channel?: string;
    allowNone?: boolean;
    onSelect(id: string | null): void;
    onClose(): void;
  }) => (
    <div>
      <p>{`panel:${props.eventLabel}:${props.purpose}:${props.selectedId}`}</p>
      <p>{`for:${props.channel}:${props.allowNone}`}</p>
      <button
        onClick={() => {
          props.onSelect('mt-2');
          props.onClose();
        }}
      >
        pick
      </button>
    </div>
  ),
}));

const templates = [
  { id: 'mt-1', name: 'Neue Rechnung', context: 'invoiceCreation' },
  { id: 'mt-2', name: 'Mahnung', context: null },
] as any;

const onChange = vi.fn();

const renderField = (
  props: Partial<Parameters<typeof MailTemplateField>[0]> = {}
) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MailTemplateField
        templates={templates}
        label="Rechnungserstellung"
        purpose={MailTemplateContext.InvoiceCreation}
        onChange={onChange}
        {...props}
      />
    </ThemeProvider>
  );

describe('MailTemplateField', () => {
  beforeEach(() => onChange.mockReset());

  it('shows the chosen template by its name alone, named after the event', () => {
    renderField({ value: 'mt-1' });

    expect(
      screen.getByRole('button', {
        name: 'Rechnungserstellung: Neue Rechnung',
      })
    ).toBeTruthy();
  });

  it('says that nothing is sent when no template is chosen', () => {
    renderField();

    expect(
      screen.getByRole('button', {
        name: 'Rechnungserstellung: mailTemplateSelect.noMailSentSelectNow',
      })
    ).toBeTruthy();
  });

  it('keeps the chooser closed until it is asked for', () => {
    renderField();

    expect(screen.queryByText(/^panel:/)).toBeNull();
  });

  it('opens the chooser for its event, purpose and current template', () => {
    renderField({ value: 'mt-1' });

    fireEvent.click(
      screen.getByRole('button', { name: /Rechnungserstellung/ })
    );

    expect(
      screen.getByText('panel:Rechnungserstellung:invoiceCreation:mt-1')
    ).toBeTruthy();
  });

  it('hands on what was chosen and closes', async () => {
    renderField();

    fireEvent.click(
      screen.getByRole('button', { name: /Rechnungserstellung/ })
    );
    fireEvent.click(screen.getByRole('button', { name: 'pick' }));

    expect(onChange).toHaveBeenCalledWith('mt-2');
  });

  it('asks for a template in the words it is given, without the no-mail icon', () => {
    const { container } = renderField({ emptyLabel: 'Vorlage auswählen' });

    const field = screen.getByRole('button', {
      name: 'Rechnungserstellung: Vorlage auswählen',
    });

    // Only the arrow that opens the chooser is left.
    expect(field.querySelectorAll('svg')).toHaveLength(1);
    expect(container.textContent).not.toContain('noMailSentSelectNow');
  });

  it('hands the channel on, and whether sending nothing is a choice', () => {
    renderField({ channel: MailChannel.Letter, allowNone: false });

    fireEvent.click(
      screen.getByRole('button', { name: /Rechnungserstellung/ })
    );

    expect(screen.getByText('for:letter:false')).toBeTruthy();
  });

  it('cannot be opened when changing is not allowed', () => {
    renderField({ disabled: true });

    expect(
      screen.getByRole('button', { name: /Rechnungserstellung/ })
    ).toBeDisabled();
  });
});
