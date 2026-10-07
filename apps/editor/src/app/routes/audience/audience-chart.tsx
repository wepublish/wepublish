import styled from '@emotion/styled';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { Placeholder } from 'rsuite';

import { ColorMode, useColorMode } from '../../colorMode';
import {
  activeTrend,
  netChange,
  niceTicks,
  segmentPlacement,
} from './audience-chart-utils';
import { AudienceClientFilter } from './audience-filter-params';
import { AudienceStatsComputed } from './useAudience';

type SeriesColor =
  | 'renewed'
  | 'replaced'
  | 'created'
  | 'high'
  | 'low'
  | 'overdue'
  | 'deactivated'
  | 'ending';

const seriesPalette: Record<ColorMode, Record<SeriesColor, string>> = {
  light: {
    renewed: '#2a78d6',
    replaced: '#eb6834',
    created: '#1baf7a',
    high: '#008300',
    low: '#e87ba4',
    overdue: '#4a3aa7',
    deactivated: '#e34948',
    ending: '#eda100',
  },
  dark: {
    renewed: '#3987e5',
    replaced: '#d95926',
    created: '#199e70',
    high: '#008300',
    low: '#d55181',
    overdue: '#9085e9',
    deactivated: '#e66767',
    ending: '#c98500',
  },
};

const chrome: Record<
  ColorMode,
  {
    ink: string;
    grid: string;
    baseline: string;
    tick: string;
    cursor: string;
    surface: string;
  }
> = {
  light: {
    ink: '#1f2937',
    grid: '#eceef2',
    baseline: '#c9cdd4',
    tick: '#6b7280',
    cursor: 'rgba(16, 24, 40, 0.05)',
    surface: '#ffffff',
  },
  dark: {
    ink: '#e9ebf0',
    grid: '#262b34',
    baseline: '#3a404b',
    tick: '#8b93a1',
    cursor: 'rgba(255, 255, 255, 0.05)',
    surface: '#1a1d24',
  },
};

interface FlowSeries {
  key: string;
  filter: keyof AudienceClientFilter;
  color: SeriesColor;
  forecast?: boolean;
}

const GAINS: FlowSeries[] = [
  {
    key: 'predictedSubscriptionRenewalCount.perDayHighProbability',
    filter: 'predictedSubscriptionRenewalCount',
    color: 'high',
    forecast: true,
  },
  {
    key: 'predictedSubscriptionRenewalCount.perDayLowProbability',
    filter: 'predictedSubscriptionRenewalCount',
    color: 'low',
    forecast: true,
  },
  {
    key: 'renewedSubscriptionCount',
    filter: 'renewedSubscriptionCount',
    color: 'renewed',
  },
  {
    key: 'replacedSubscriptionCount',
    filter: 'replacedSubscriptionCount',
    color: 'replaced',
  },
  {
    key: 'createdSubscriptionCount',
    filter: 'createdSubscriptionCount',
    color: 'created',
  },
];

const LOSSES: FlowSeries[] = [
  {
    key: 'overdueSubscriptionCount',
    filter: 'overdueSubscriptionCount',
    color: 'overdue',
  },
  {
    key: 'deactivatedSubscriptionCount',
    filter: 'deactivatedSubscriptionCount',
    color: 'deactivated',
  },
  {
    key: 'endingSubscriptionCount',
    filter: 'endingSubscriptionCount',
    color: 'ending',
    forecast: true,
  },
];

const numberLocale = (language: string) =>
  ({ de: 'de-CH', fr: 'fr-CH' })[language] ?? 'en-GB';

export function useAudienceChartColors(): {
  [K in keyof AudienceClientFilter]: string | string[];
} {
  const { mode } = useColorMode();
  const colors = seriesPalette[mode];

  return {
    totalActiveSubscriptionCount: chrome[mode].ink,
    createdSubscriptionCount: colors.created,
    overdueSubscriptionCount: colors.overdue,
    deactivatedSubscriptionCount: colors.deactivated,
    renewedSubscriptionCount: colors.renewed,
    replacedSubscriptionCount: colors.replaced,
    predictedSubscriptionRenewalCount: [colors.high, colors.low],
    endingSubscriptionCount: colors.ending,
  };
}

const Charts = styled.div<{ refreshing: boolean }>`
  display: grid;
  gap: 16px;
  opacity: ${({ refreshing }) => (refreshing ? 0.55 : 1)};
  transition: opacity 0.2s ease-out;
`;

const ChartCard = styled.section`
  padding: 20px 20px 12px;
  border: 1px solid var(--wep-shell-border, var(--rs-border-primary));
  border-radius: var(--rs-radius-lg);
  background-color: var(--rs-bg-card);
  box-shadow: var(--wep-surface-shadow);

  .rs-panel-body & {
    padding: 0;
    border: none;
    box-shadow: none;
  }

  .recharts-surface:focus,
  .recharts-wrapper:focus {
    outline: none;
  }
`;

const CardHead = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.375rem;
  font-weight: 600;
  color: var(--rs-text-secondary);
  letter-spacing: 0;
`;

const HeroValue = styled.div`
  margin-top: 4px;
  font-size: 2.5rem;
  line-height: 1.1;
  font-weight: 650;
  letter-spacing: -0.03em;
  color: var(--rs-text-heading);
`;

const Delta = styled.div<{ direction: 'up' | 'down' | 'flat' }>`
  margin-top: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ direction }) =>
    direction === 'up' ? 'var(--wep-state-published-text, #2f6b2a)'
    : direction === 'down' ? 'var(--rs-red-700, #c4302b)'
    : 'var(--rs-text-secondary)'};

  span {
    margin-left: 6px;
    font-weight: 400;
    color: var(--rs-text-secondary);
  }
`;

const LegendList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  color: var(--rs-text-secondary);

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
`;

const Swatch = styled.span<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background-color: ${({ color }) => color};
`;

const TooltipCard = styled.div`
  min-width: 220px;
  padding: 10px 12px;
  border: 1px solid var(--wep-shell-border, var(--rs-border-primary));
  border-radius: var(--rs-radius-md);
  background-color: var(--rs-bg-overlay);
  box-shadow: var(--wep-elevated-shadow);
  font-size: 0.8125rem;
  color: var(--rs-text-secondary);
`;

const TooltipDate = styled.div`
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--rs-text-heading);
`;

const TooltipRow = styled.div`
  display: grid;
  grid-template-columns: 12px auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 2px 0;

  strong {
    font-variant-numeric: tabular-nums;
    color: var(--rs-text-heading);
  }
`;

const LineKey = styled.span<{ color: string }>`
  width: 12px;
  height: 3px;
  border-radius: 2px;
  background-color: ${({ color }) => color};
`;

const TooltipEmpty = styled.div`
  color: var(--rs-text-secondary);
`;

const TooltipNet = styled(TooltipRow)`
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--rs-border-primary);
`;

const roundedSegment = (
  x: number,
  top: number,
  width: number,
  bottom: number,
  radius: number,
  roundTop: boolean
) => {
  const r = Math.min(radius, width / 2, bottom - top);

  if (r <= 0) {
    return `M${x},${top}h${width}v${bottom - top}h${-width}Z`;
  }

  return roundTop ?
      `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${bottom}Z`
    : `M${x},${top}H${x + width}V${bottom - r}Q${x + width},${bottom} ${x + width - r},${bottom}H${x + r}Q${x},${bottom} ${x},${bottom - r}Z`;
};

interface SegmentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: Record<string, unknown>;
}

const segmentShape =
  (dataKey: string, order: string[], gains: boolean) =>
  ({ x = 0, y = 0, width = 0, height = 0, fill, payload }: SegmentProps) => {
    const top = Math.min(y, y + height);
    const bottom = Math.max(y, y + height);

    if (!payload || width <= 0 || bottom - top <= 0) {
      return <g />;
    }

    const { outermost } = segmentPlacement(payload, dataKey, order);

    return (
      <path
        d={roundedSegment(x, top, width, bottom, outermost ? 4 : 0, gains)}
        fill={fill}
      />
    );
  };

interface TooltipSeries {
  key: string;
  label: string;
  color: string;
  forecast?: boolean;
}

interface FlowTooltipBodyProps {
  date: string;
  datum: Record<string, unknown>;
  series: TooltipSeries[];
  monthly: boolean;
  formatNumber: (value: number) => string;
}

export function FlowTooltipBody({
  date,
  datum,
  series,
  monthly,
  formatNumber,
}: FlowTooltipBodyProps) {
  const { t } = useTranslation();
  const rows = series.filter(
    entry => typeof datum[entry.key] === 'number' && datum[entry.key] !== 0
  );
  const actual = series.filter(entry => !entry.forecast);
  const hasActual = rows.some(entry => !entry.forecast);
  const net = netChange(
    datum,
    actual.map(entry => entry.key)
  );

  return (
    <TooltipCard>
      <TooltipDate>{date}</TooltipDate>
      {!rows.length && (
        <TooltipEmpty>
          {t(
            monthly ?
              'audience.chart.noActivityMonth'
            : 'audience.chart.noActivityDay'
          )}
        </TooltipEmpty>
      )}
      {rows.map(entry => (
        <TooltipRow key={entry.key}>
          <LineKey color={entry.color} />
          <strong>{formatNumber(Math.abs(datum[entry.key] as number))}</strong>
          <span>{entry.label}</span>
        </TooltipRow>
      ))}
      {hasActual && (
        <TooltipNet>
          <span />
          <strong>
            {net > 0 ? '+' : ''}
            {formatNumber(net)}
          </strong>
          <span>{t('audience.chart.net')}</span>
        </TooltipNet>
      )}
    </TooltipCard>
  );
}

interface AudienceChartProps {
  audienceStats: AudienceStatsComputed[];
  clientFilter: AudienceClientFilter;
  loading?: boolean;
}

export function AudienceChart({
  clientFilter,
  audienceStats,
  loading,
}: AudienceChartProps) {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const { mode } = useColorMode();
  const colors = seriesPalette[mode];
  const ui = chrome[mode];
  const locale = numberLocale(language);

  const gains = GAINS.filter(series => clientFilter[series.filter]);
  const losses = LOSSES.filter(series => clientFilter[series.filter]);
  const flows = [...gains, ...losses];
  const gainKeys = gains.map(series => series.key);
  const lossKeys = losses.map(series => series.key);

  const monthly = useMemo(() => {
    if (audienceStats.length < 2) {
      return false;
    }

    const gap =
      new Date(audienceStats[1].date).getTime() -
      new Date(audienceStats[0].date).getTime();

    return gap > 20 * 24 * 60 * 60 * 1000;
  }, [audienceStats]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(Math.round(value)).replace('-', '−');

  const formatTick = (date: string) =>
    new Date(date).toLocaleDateString(
      locale,
      monthly ?
        { month: 'short', year: '2-digit' }
      : { day: 'numeric', month: 'short' }
    );

  const formatLong = (date: string) =>
    new Date(date).toLocaleDateString(
      locale,
      monthly ? { month: 'long', year: 'numeric' } : { dateStyle: 'medium' }
    );

  const label = (key: string) =>
    t([
      `audience.legend.${key}`,
      `audience.legend.${key.split('.').join('_variants.')}`,
    ]);

  const trend = activeTrend(audienceStats);
  const activeTicks = useMemo(() => {
    const values = audienceStats.map(
      stat => stat.totalActiveSubscriptionCount ?? 0
    );

    return values.length ?
        niceTicks(Math.min(...values), Math.max(...values))
      : [0, 1];
  }, [audienceStats]);

  if (!audienceStats.length) {
    return loading ? <Placeholder.Graph active /> : null;
  }

  const axisTick = { fill: ui.tick, fontSize: 12 };

  const renderFlowTooltip = ({
    active,
    payload,
    label: date,
  }: TooltipContentProps<ValueType, NameType>) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <FlowTooltipBody
        date={formatLong(String(date))}
        datum={payload[0].payload as Record<string, unknown>}
        series={flows.map(series => ({
          key: series.key,
          label: label(series.key),
          color: colors[series.color],
          forecast: series.forecast,
        }))}
        monthly={monthly}
        formatNumber={formatNumber}
      />
    );
  };

  const renderActiveTooltip = ({
    active,
    payload,
    label: date,
  }: TooltipContentProps<ValueType, NameType>) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <TooltipCard>
        <TooltipDate>{formatLong(String(date))}</TooltipDate>
        <TooltipRow>
          <LineKey color={ui.ink} />
          <strong>{formatNumber(Number(payload[0].value))}</strong>
          <span>{label('totalActiveSubscriptionCount')}</span>
        </TooltipRow>
      </TooltipCard>
    );
  };

  const direction =
    !trend || trend.delta === 0 ? 'flat'
    : trend.delta > 0 ? 'up'
    : 'down';

  return (
    <Charts
      refreshing={!!loading}
      data-testid="audience-charts"
    >
      {clientFilter.totalActiveSubscriptionCount && trend && (
        <ChartCard>
          <CardHead>
            <div>
              <CardTitle>
                {label('totalActiveSubscriptionCount')}{' '}
                <InfoTooltip
                  text={t('audience.legend.info.totalActiveSubscriptionCount')}
                />
              </CardTitle>
              <HeroValue>{formatNumber(trend.latest)}</HeroValue>
              <Delta direction={direction}>
                {trend.delta > 0 ? '+' : ''}
                {formatNumber(trend.delta)}
                {trend.ratio !== null &&
                  ` (${trend.ratio > 0 ? '+' : ''}${new Intl.NumberFormat(
                    locale,
                    { style: 'percent', maximumFractionDigits: 1 }
                  )
                    .format(trend.ratio)
                    .replace('-', '−')})`}
                <span>
                  {t('audience.chart.since', {
                    date: formatLong(audienceStats[0].date),
                  })}
                </span>
              </Delta>
            </div>
          </CardHead>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <AreaChart
              data={audienceStats}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="audience-active-fill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={ui.ink}
                    stopOpacity={0.14}
                  />
                  <stop
                    offset="100%"
                    stopColor={ui.ink}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={ui.grid}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: ui.baseline }}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                domain={[activeTicks[0], activeTicks[activeTicks.length - 1]]}
                ticks={activeTicks}
                tickFormatter={formatNumber}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                content={renderActiveTooltip}
                cursor={{ stroke: ui.baseline, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="totalActiveSubscriptionCount"
                baseValue={activeTicks[0]}
                stroke={ui.ink}
                strokeWidth={2}
                fill="url(#audience-active-fill)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: ui.ink,
                  stroke: ui.surface,
                  strokeWidth: 2,
                }}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {flows.length > 0 && (
        <ChartCard>
          <CardHead>
            <CardTitle>
              {t('audience.chart.flowsTitle')}{' '}
              <InfoTooltip text={t('audience.chart.flowsInfo')} />
            </CardTitle>
            <LegendList>
              {flows.map(series => (
                <li key={series.key}>
                  <Swatch color={colors[series.color]} />
                  {label(series.key)}
                </li>
              ))}
            </LegendList>
          </CardHead>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <BarChart
              data={audienceStats}
              stackOffset="sign"
              barCategoryGap="22%"
              maxBarSize={24}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={ui.grid}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={formatNumber}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={56}
              />
              <ReferenceLine
                y={0}
                stroke={ui.baseline}
              />
              <Tooltip
                content={renderFlowTooltip}
                cursor={{ fill: ui.cursor }}
              />
              {gains.map(series => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  stackId="flow"
                  fill={colors[series.color]}
                  shape={segmentShape(series.key, gainKeys, true)}
                  animationDuration={500}
                />
              ))}
              {losses.map(series => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  stackId="flow"
                  fill={colors[series.color]}
                  shape={segmentShape(series.key, lossKeys, false)}
                  animationDuration={500}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </Charts>
  );
}
