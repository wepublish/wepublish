import styled from '@emotion/styled';
import {
  SubscriptionFilter,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import { DailySubscriptionStatsUser } from '@wepublish/editor/api-v2';
import { useExportSubscriptionsAsCsv } from '@wepublish/ui/editor';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Col,
  DateRangePicker,
  Grid,
  Panel,
  Radio,
  RadioGroup,
  Row,
  TagPicker,
  Toggle,
} from 'rsuite';
import { RangeType } from 'rsuite/esm/DateRangePicker';

import { AudienceFilterToggle, ToggleLable } from './audience-filter-toggle';
import { AudienceStatsComputed } from './useAudience';
import {
  AudienceApiFilter,
  AudienceClientFilter,
  AudienceComponentFilter,
  preDefinedDates,
  TimeResolution,
} from './useAudienceFilter';

const TagPickerStyled = styled(TagPicker)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const ComponentFilterContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
  display: flex;
  flex-wrap: wrap;
`;

const ToggleContainer = styled('div')`
  margin-right: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export interface AudienceFilterProps {
  resolution: TimeResolution;
  setResolution: Dispatch<SetStateAction<TimeResolution>>;
  clientFilter: AudienceClientFilter;
  setClientFilter: Dispatch<SetStateAction<AudienceClientFilter>>;
  apiFilter: AudienceApiFilter;
  setApiFilter: (data: AudienceApiFilter) => void;
  componentFilter: AudienceComponentFilter;
  setComponentFilter: Dispatch<SetStateAction<AudienceComponentFilter>>;
  audienceStatsByPeriod: AudienceStatsComputed[];
}

const filterKeyMap: Record<string, string> = {
  createdSubscriptionCount: 'createdSubscriptionUsers',
  overdueSubscriptionCount: 'overdueSubscriptionUsers',
  renewedSubscriptionCount: 'renewedSubscriptionUsers',
  replacedSubscriptionCount: 'replacedSubscriptionUsers',
  totalActiveSubscriptionCount: 'totalActiveSubscriptionUsers',
  deactivatedSubscriptionCount: 'deactivatedSubscriptionUsers',
};

export function AudienceFilter({
  resolution,
  setResolution,
  clientFilter,
  setClientFilter,
  apiFilter,
  setApiFilter,
  componentFilter,
  setComponentFilter,
  audienceStatsByPeriod,
}: AudienceFilterProps) {
  const { t } = useTranslation();

  const { initDownload, getCsv } = useExportSubscriptionsAsCsv();

  // load available subscription plans
  const { data: memberPlans } = useMemberPlanListQuery();

  const memberPlansForPicker = useMemo<
    { label: string; value: string }[]
  >(() => {
    return (
      memberPlans?.memberPlans.nodes.map(memberPlan => ({
        label: memberPlan.name,
        value: memberPlan.id,
      })) || []
    );
  }, [memberPlans]);

  const oneClickDateRanges = useMemo<RangeType[]>(() => {
    const { today, lastWeek, lastMonth, lastQuarter, lastYear } =
      preDefinedDates();
    return [
      {
        label: t('audienceFilter.rangeLastWeek'),
        value: [lastWeek, today],
      },
      {
        label: t('audienceFilter.rangeLastMonth'),
        value: [lastMonth, today],
      },
      {
        label: t('audienceFilter.rangeLastQuarter'),
        value: [lastQuarter, today],
      },
      {
        label: t('audienceFilter.rangeLastYear'),
        value: [lastYear, today],
      },
    ];
  }, [t]);

  const handleClick = (filterKey: string) => {
    /*
    console.log(
      filterKey,
      audienceStatsByPeriod,
      audienceStatsByPeriod[0][
        filterKeyMap[filterKey] as keyof AudienceStatsComputed
      ],
      filterKeyMap[filterKey] as keyof AudienceStatsComputed
    );
    */

    let statsUsers: DailySubscriptionStatsUser[];
    if (
      (filterKeyMap[filterKey] as keyof AudienceStatsComputed as string) ===
      'totalActiveSubscriptionUsers'
    ) {
      const renewedUsers = audienceStatsByPeriod[0][
        'renewedSubscriptionUsers'
      ] as DailySubscriptionStatsUser[];
      const replacedUsers = audienceStatsByPeriod[0][
        'replacedSubscriptionUsers'
      ] as DailySubscriptionStatsUser[];
      const createdUsers = audienceStatsByPeriod[0][
        'createdSubscriptionUsers'
      ] as DailySubscriptionStatsUser[];

      statsUsers = [...createdUsers, ...renewedUsers, ...replacedUsers];
    } else {
      statsUsers = audienceStatsByPeriod[0][
        filterKeyMap[filterKey] as keyof AudienceStatsComputed
      ] as DailySubscriptionStatsUser[];
    }

    const filter: SubscriptionFilter = {
      userIDs: statsUsers.map((user: DailySubscriptionStatsUser) => user.id),
    };

    initDownload(getCsv, filter);
  };

  return (
    <Grid style={{ width: '100%' }}>
      <Row>
        {/* select date range */}
        <Col xs={4}>
          <RadioGroup
            name="aggregation-picker"
            inline
            appearance="picker"
            defaultValue={resolution}
            onChange={newResolution =>
              setResolution(newResolution as TimeResolution)
            }
          >
            <Radio value="daily">{t('audienceFilter.daily')}</Radio>
            <Radio value="monthly">{t('audienceFilter.monthly')}</Radio>
          </RadioGroup>
        </Col>

        <Col xs={6}>
          <DateRangePicker
            size="lg"
            value={apiFilter.dateRange}
            onChange={newDateRange => setApiFilter({ dateRange: newDateRange })}
            format="dd.MM.yyyy"
            placeholder={t('audienceFilter.rangePickerPlaceholder')}
            style={{ width: '100%' }}
            ranges={oneClickDateRanges as RangeType[]}
          />
          <TagPickerStyled
            size="lg"
            data={memberPlansForPicker}
            style={{ width: '100%' }}
            placeholder={t('audienceFilter.filterSubscriptionPlans')}
            onChange={newMemberPlanIds =>
              setApiFilter({ memberPlanIds: newMemberPlanIds })
            }
          />

          <ComponentFilterContainer>
            <ToggleContainer>
              <Toggle
                checked={componentFilter.chart}
                onChange={chart =>
                  setComponentFilter({ ...componentFilter, chart })
                }
              />{' '}
              <ToggleLable>{t('audienceFilter.chart')}</ToggleLable>
            </ToggleContainer>
            <ToggleContainer>
              <Toggle
                checked={componentFilter.table}
                onChange={table =>
                  setComponentFilter({ ...componentFilter, table })
                }
              />{' '}
              <ToggleLable>{t('audienceFilter.table')}</ToggleLable>
            </ToggleContainer>
          </ComponentFilterContainer>
        </Col>

        {/* filter data */}
        <Col xs={14}>
          <Panel
            header={t('audienceFilter.panelHeader')}
            bordered
          >
            <Row>
              {Object.keys(clientFilter).map((filterKey, filterIndex) => (
                <Col
                  xs={12}
                  key={`client-filter-${filterIndex}`}
                >
                  <AudienceFilterToggle
                    filterKey={filterKey as keyof AudienceClientFilter}
                    clientFilter={clientFilter}
                    setClientFilter={setClientFilter}
                  />
                  <button onClick={() => handleClick(filterKey)}>CSV</button>
                </Col>
              ))}
            </Row>
          </Panel>
        </Col>
      </Row>
    </Grid>
  );
}
