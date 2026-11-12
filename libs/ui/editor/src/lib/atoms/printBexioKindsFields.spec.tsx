import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render as renderBare,
  screen,
  within,
} from '@testing-library/react';
import { ReactElement } from 'react';
import {
  type PrintBexioKindValue,
  PrintBexioKindsFields,
  printBexioKindsOf,
} from './printBexioKindsFields';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

const theme = createTheme({ cssVariables: true });
const render = (element: ReactElement) =>
  renderBare(<ThemeProvider theme={theme}>{element}</ThemeProvider>);

const GIFT: PrintBexioKindValue = {
  id: 'gift',
  label: 'Geschenkabo',
  word: 'NW Geschenkabo',
  refersTo: 'period',
};
const SINGLE: PrintBexioKindValue = {
  id: 'single',
  label: 'Einzelheft',
  word: 'Einzelheft',
  refersTo: 'issue',
};

describe('PrintBexioKindsFields', () => {
  it('shows each kind with its label, word and what follows the word', () => {
    render(
      <PrintBexioKindsFields
        value={[GIFT, SINGLE]}
        onChange={vi.fn()}
      />
    );

    const rows = screen.getAllByRole('group', {
      name: /printBexioKinds\.kind/,
    });
    expect(rows).toHaveLength(2);
    expect(
      within(rows[0]!).getByRole('textbox', { name: 'printBexioKinds.label' })
    ).toHaveValue('Geschenkabo');
    expect(
      within(rows[0]!).getByRole('textbox', { name: 'printBexioKinds.word' })
    ).toHaveValue('NW Geschenkabo');
    expect(
      within(rows[1]!).getByRole('combobox', {
        name: /printBexioKinds\.refersTo/,
      })
    ).toHaveTextContent('printBexioKinds.refersToIssue');
  });

  it('says so while no kind is configured', () => {
    render(
      <PrintBexioKindsFields
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('printBexioKinds.empty')).toBeInTheDocument();
  });

  it('adds a kind with a new id, referring to a period', () => {
    const onChange = vi.fn();
    render(
      <PrintBexioKindsFields
        value={[GIFT]}
        onChange={onChange}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'printBexioKinds.add' })
    );

    const [kinds] = onChange.mock.calls[0]!;
    expect(kinds).toHaveLength(2);
    expect(kinds[0]).toBe(GIFT);
    expect(kinds[1]).toMatchObject({ label: '', word: '', refersTo: 'period' });
    expect(kinds[1].id).toMatch(/\S{8,}/);
    expect(kinds[1].id).not.toBe(GIFT.id);
  });

  it('changes one field of one kind and keeps its id', () => {
    const onChange = vi.fn();
    render(
      <PrintBexioKindsFields
        value={[GIFT, SINGLE]}
        onChange={onChange}
      />
    );

    fireEvent.change(
      within(
        screen.getAllByRole('group', { name: /printBexioKinds\.kind/ })[1]!
      ).getByRole('textbox', { name: 'printBexioKinds.word' }),
      { target: { value: 'Einzelausgabe' } }
    );

    expect(onChange).toHaveBeenCalledWith([
      GIFT,
      { ...SINGLE, word: 'Einzelausgabe' },
    ]);
  });

  it('deletes a kind', () => {
    const onChange = vi.fn();
    render(
      <PrintBexioKindsFields
        value={[GIFT, SINGLE]}
        onChange={onChange}
      />
    );

    fireEvent.click(
      within(
        screen.getAllByRole('group', { name: /printBexioKinds\.kind/ })[0]!
      ).getByRole('button', { name: /printBexioKinds\.delete/ })
    );

    expect(onChange).toHaveBeenCalledWith([SINGLE]);
  });
});

describe('printBexioKindsOf', () => {
  it('keeps complete kinds and drops anything else', () => {
    expect(printBexioKindsOf([GIFT, { id: 1 }, 'x', null])).toEqual([GIFT]);
    expect(printBexioKindsOf(undefined)).toEqual([]);
  });
});
