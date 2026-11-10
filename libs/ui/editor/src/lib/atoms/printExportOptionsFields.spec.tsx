import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render as renderBare,
  screen,
} from '@testing-library/react';
import { ReactElement } from 'react';
import {
  DEFAULT_PRINT_EXPORT_OPTIONS,
  describePrintExportOptions,
  PrintExportOptionsFields,
} from './printExportOptionsFields';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  // the plan picker reads the member plans itself
  useQuery: () => ({ data: undefined, refetch: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

const t = (key: string, values?: Record<string, unknown>) =>
  values ? `${key} ${JSON.stringify(values)}` : key;

const theme = createTheme({ cssVariables: true });
const render = (element: ReactElement) =>
  renderBare(<ThemeProvider theme={theme}>{element}</ThemeProvider>);

describe('PrintExportOptionsFields', () => {
  it('reflects the value and hands every change back whole', () => {
    const onChange = vi.fn();
    render(
      <PrintExportOptionsFields
        value={{ ...DEFAULT_PRINT_EXPORT_OPTIONS, includeUpcoming: true }}
        onChange={onChange}
      />
    );

    expect(
      screen.getByRole('switch', { name: 'printExportOptions.includeBexio' })
    ).toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'printExportOptions.includeOpen' })
    ).toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'printExportOptions.includeUpcoming' })
    ).toBeChecked();

    fireEvent.click(
      screen.getByRole('switch', { name: 'printExportOptions.includeOpen' })
    );

    expect(onChange).toHaveBeenCalledWith({
      memberPlanIds: null,
      includeBexio: true,
      includeOpen: false,
      includeUpcoming: true,
    });
  });

  it('offers the member plans and treats an empty pick as every plan', () => {
    render(
      <PrintExportOptionsFields
        value={DEFAULT_PRINT_EXPORT_OPTIONS}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByLabelText('printExportOptions.memberPlans')
    ).toBeInTheDocument();
    expect(
      screen.getByText('printExportOptions.memberPlansHelp')
    ).toBeInTheDocument();
  });

  it('disables bexio with a hint while no provider has a key', () => {
    render(
      <PrintExportOptionsFields
        value={DEFAULT_PRINT_EXPORT_OPTIONS}
        onChange={vi.fn()}
        bexioConfigured={false}
      />
    );

    expect(
      screen.getByRole('switch', { name: 'printExportOptions.includeBexio' })
    ).toBeDisabled();
    expect(
      screen.getByText('printExportOptions.bexioNotConfigured')
    ).toBeInTheDocument();
  });

  it('can be locked as a whole', () => {
    render(
      <PrintExportOptionsFields
        value={DEFAULT_PRINT_EXPORT_OPTIONS}
        onChange={vi.fn()}
        disabled
      />
    );

    screen.getAllByRole('switch').forEach(box => expect(box).toBeDisabled());
  });
});

describe('describePrintExportOptions', () => {
  it('sums the options up in a line', () => {
    expect(describePrintExportOptions(DEFAULT_PRINT_EXPORT_OPTIONS, t)).toBe(
      'printExportOptions.allPlans · printExportOptions.bexioShort · printExportOptions.openShort'
    );
    expect(
      describePrintExportOptions(
        {
          memberPlanIds: ['a', 'b'],
          includeBexio: false,
          includeOpen: false,
          includeUpcoming: true,
        },
        t
      )
    ).toBe(
      'printExportOptions.plansCount {"count":2} · printExportOptions.upcomingShort'
    );
  });
});
