import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { AudienceTable } from './audience-table';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  DataTable: ({
    data,
    columns,
  }: {
    data: Record<string, unknown>[];
    columns: { id: string; render: (row: unknown) => ReactNode }[];
  }) => (
    <table>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map(column => (
              <td key={column.id}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock('./audience-detail-drawer', () => ({
  AudienceDetailDrawer: () => null,
}));

const day = (date: string) => ({
  date,
  totalToBeRenewed: 0,
  renewalRate: 0,
  cancellationRate: 0,
  renewedSubscriptionCount: 0,
  replacedSubscriptionCount: 0,
  deactivatedSubscriptionCount: 0,
  overdueSubscriptionCount: 0,
});

describe('AudienceTable', () => {
  it('tells the detail buttons apart by their date', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AudienceTable
          audienceStats={
            [
              day('2026-09-25T00:00:00.000Z'),
              day('2026-09-26T00:00:00.000Z'),
            ] as never
          }
          clientFilter={{} as never}
          timeResolution="daily"
        />
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('button', {
        name: 'audienceTable.showUsers Sep 25, 2026',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'audienceTable.showUsers Sep 26, 2026',
      })
    ).toBeInTheDocument();
  });
});
