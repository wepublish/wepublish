import { render, screen } from '@testing-library/react';

import { FlowTooltipBody } from './audience-chart';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'de' },
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
  render(
    <FlowTooltipBody
      date="20. Sept. 2026"
      datum={datum}
      series={series}
      monthly={monthly}
      formatNumber={value => String(value)}
    />
  );

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
