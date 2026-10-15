import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { LetterAppendixPicker } from './letter-appendix-picker';

const useQuery = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (...args: unknown[]) => useQuery(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const documents = [
  {
    id: 'qr-bill',
    title: 'QR-Einzahlungsschein',
    filename: 'qr',
    mimeType: 'application/pdf',
  },
  {
    id: 'terms',
    title: null,
    filename: 'agb',
    mimeType: 'application/pdf',
  },
  {
    id: 'sheet',
    title: 'Tabelle',
    filename: 'tabelle',
    mimeType: 'text/csv',
  },
];

describe('LetterAppendixPicker', () => {
  beforeEach(() => {
    useQuery.mockReturnValue({ data: { documents: { nodes: documents } } });
  });

  afterEach(cleanup);

  it('offers only pdf documents', () => {
    render(
      <LetterAppendixPicker
        value={null}
        onChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText('QR-Einzahlungsschein')).toBeTruthy();
    expect(screen.getByText('agb')).toBeTruthy();
    expect(screen.queryByText('Tabelle')).toBeNull();
  });

  it('reports the chosen document', () => {
    const onChange = vi.fn();
    render(
      <LetterAppendixPicker
        value={null}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('QR-Einzahlungsschein'));

    expect(onChange).toHaveBeenCalledWith('qr-bill');
  });

  it('shows the chosen document', () => {
    render(
      <LetterAppendixPicker
        value="qr-bill"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('QR-Einzahlungsschein')).toBeTruthy();
  });
});
