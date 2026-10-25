import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { cloneElement, ReactElement, ReactNode } from 'react';

import { AudienceChart, FlowTooltipBody } from './audience-chart';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'de' },
  }),
}));

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactElement }) =>
    cloneElement(children as ReactElement<Record<string, unknown>>, {
      width: 600,
      height: 300,
    }),
}));

const series = [
  {
    key: 'createdSubscriptionCount',
    label: 'Neue Abos',
    color: '#1baf7a',
  },
  {
    key: 'deactivatedSubscriptionCount',
    label: 'Deaktivierte Abos',
    color: '#e34948',
  },
];

const renderBody = (datum: Record<string, unknown>, monthly = false) =>
  renderWithTheme(
    <FlowTooltipBody
      date="20. Sept. 2026"
      datum={datum}
      series={series}
      monthly={monthly}
      formatNumber={value => String(value)}
    />
  );

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('FlowTooltipBody', () => {
  it('says that nothing happened on a day without activity', () => {
    renderBody({
      createdSubscriptionCount: 0,
      deactivatedSubscriptionCount: 0,
    });

    expect(screen.getByText('audience.chart.noActivityDay')).not.toBeNull();
    expect(screen.queryByText('audience.chart.net')).toBeNull();
  });

  it('uses the month wording in the monthly view', () => {
    renderBody({}, true);

    expect(screen.getByText('audience.chart.noActivityMonth')).not.toBeNull();
  });

  it('lists the series of the day with their absolute values and the net', () => {
    renderBody({
      createdSubscriptionCount: 4,
      deactivatedSubscriptionCount: -2,
    });

    expect(screen.getByText('Neue Abos')).not.toBeNull();
    expect(screen.getByText('Deaktivierte Abos')).not.toBeNull();
    expect(screen.getByText('2')).not.toBeNull();
    expect(screen.getByText('+2')).not.toBeNull();
    expect(screen.queryByText('audience.chart.noActivityDay')).toBeNull();
  });
});

describe('AudienceChart', () => {
  const stats = [
    {
      date: '2026-09-20T00:00:00.000Z',
      totalActiveSubscriptionCount: 10,
      createdSubscriptionCount: 1,
    },
    {
      date: '2026-09-21T00:00:00.000Z',
      totalActiveSubscriptionCount: 11,
      createdSubscriptionCount: 1,
    },
  ];

  const renderChart = (headingLevel?: 2 | 3) =>
    renderWithTheme(
      <AudienceChart
        audienceStats={stats as never}
        clientFilter={
          {
            totalActiveSubscriptionCount: true,
            createdSubscriptionCount: true,
          } as never
        }
        headingLevel={headingLevel}
      />
    );

  it('titles its cards one level below the page title by default', () => {
    renderChart();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /audience.chart.flowsTitle/,
      })
    ).toBeInTheDocument();
  });

  it('nests its card titles under a surrounding section', () => {
    renderChart(3);

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /audience.chart.flowsTitle/,
      })
    ).toBeInTheDocument();
  });

  it('names each chart instead of reading out its axis ticks', () => {
    renderChart();

    expect(
      screen
        .getByRole('application', { name: 'audience.chart.flowsTitle' })
        .querySelector('desc')
    ).toHaveTextContent('audience.chart.keyboardHint');
    expect(
      screen.getByRole('application', {
        name: /^audience.legend.totalActiveSubscriptionCount/,
      })
    ).toBeInTheDocument();
  });
});
