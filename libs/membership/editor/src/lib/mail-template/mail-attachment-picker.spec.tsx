import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material';

import { DOCX, MailAttachmentPicker } from './mail-attachment-picker';

const theme = createTheme({ cssVariables: true });

const useQuery = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (...args: unknown[]) => useQuery(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const documents = [
  { id: 'contract', title: 'Vertrag', filename: 'vertrag', mimeType: DOCX },
  { id: 'terms', title: null, filename: 'agb', mimeType: DOCX },
  {
    id: 'qr-bill',
    title: 'QR-Einzahlungsschein',
    filename: 'qr',
    mimeType: 'application/pdf',
  },
  {
    id: 'old',
    title: 'Alter Vertrag',
    filename: 'alt',
    mimeType: 'application/msword',
  },
];

const renderPicker = (value: string[], onChange = vi.fn()) =>
  render(
    <ThemeProvider theme={theme}>
      <MailAttachmentPicker
        value={value}
        onChange={onChange}
      />
    </ThemeProvider>
  );

const open = () => fireEvent.mouseDown(screen.getByRole('combobox'));

describe('MailAttachmentPicker', () => {
  beforeEach(() => {
    useQuery.mockReturnValue({ data: { documents: { nodes: documents } } });
  });

  afterEach(cleanup);

  // Only .docx can be filled in; the old binary .doc cannot.
  it('offers only Word documents', () => {
    renderPicker([]);
    open();

    expect(screen.getByRole('option', { name: 'Vertrag' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'agb' })).toBeTruthy();
    expect(
      screen.queryByRole('option', { name: 'QR-Einzahlungsschein' })
    ).toBeNull();
    expect(screen.queryByRole('option', { name: 'Alter Vertrag' })).toBeNull();
  });

  it('adds a chosen document after the ones already attached', () => {
    const onChange = vi.fn();
    renderPicker(['terms'], onChange);
    open();

    fireEvent.click(screen.getByRole('option', { name: 'Vertrag' }));

    expect(onChange).toHaveBeenCalledWith(['terms', 'contract']);
  });

  it('shows the attached documents in their order', () => {
    renderPicker(['terms', 'contract']);

    const chips = screen
      .getAllByRole('button')
      .map(chip => chip.textContent)
      .filter(text => text === 'agb' || text === 'Vertrag');

    expect(chips).toEqual(['agb', 'Vertrag']);
  });

  it('removes a document', () => {
    const onChange = vi.fn();
    renderPicker(['terms', 'contract'], onChange);

    fireEvent.click(screen.getAllByTestId('CancelIcon')[0]);

    expect(onChange).toHaveBeenCalledWith(['contract']);
  });

  it('keeps an attached document it has not loaded yet', () => {
    useQuery.mockReturnValue({ data: undefined, loading: true });
    renderPicker(['contract']);

    expect(screen.getByText('contract')).toBeTruthy();
  });
});
