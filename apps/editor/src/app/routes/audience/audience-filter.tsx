import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { MemberPlanListDocument } from '@wepublish/editor/api';
import { InfoTrigger } from '@wepublish/ui/editor';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';
import type { DateRangePickerProps } from 'rsuite';
import {
  Button,
  Col,
  DateRangePicker,
  Grid,
  Message,
  Panel,
  Popover as RPopover,
  Radio,
  RadioGroup,
  Row,
  TagPicker,
  toaster,
  Toggle,
  Whisper,
} from 'rsuite';

import {
  AudienceApiFilter,
  AudienceClientFilter,
  AudienceComponentFilter,
  preDefinedDates,
  TimeResolution,
} from './audience-filter-params';
import { AudienceFilterToggle } from './audience-filter-toggle';

type RangeType = NonNullable<DateRangePickerProps['ranges']>[number];

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

const ActionContainer = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const HelpPopover = styled(RPopover)`
  max-width: 320px;

  p + p {
    margin-top: ${({ theme }) => theme.spacing(1)};
  }
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
  buildPermalink: () => string;
}

export function AudienceFilter({
  resolution,
  setResolution,
  clientFilter,
  setClientFilter,
  apiFilter,
  setApiFilter,
  componentFilter,
  setComponentFilter,
  buildPermalink,
}: AudienceFilterProps) {
  const { t } = useTranslation();

  const copyPermalink = async () => {
    try {
      await navigator.clipboard.writeText(buildPermalink());

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('audienceFilter.permalinkCopied')}
        </Message>
      );
    } catch {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={8000}
        >
          {t('audienceFilter.permalinkCopyFailed')}
        </Message>
      );
    }
  };

  const { data: memberPlans } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });

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
    const {
      today,
      lastWeek,
      lastMonth,
      lastQuarter,
      lastYear,
      nextWeek,
      nextMonth,
      nextQuarter,
      nextYear,
    } = preDefinedDates();
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
      {
        label: t('audienceFilter.rangeNextWeek'),
        value: [today, nextWeek],
      },
      {
        label: t('audienceFilter.rangeNextMonth'),
        value: [today, nextMonth],
      },
      {
        label: t('audienceFilter.rangeNextQuarter'),
        value: [today, nextQuarter],
      },
      {
        label: t('audienceFilter.rangeNextYear'),
        value: [today, nextYear],
      },
    ];
  }, [t]);

  return (
    <Grid style={{ width: '100%' }}>
      <Row>
        {/* select date range */}
        <Col
          xs={24}
          xl={4}
        >
          <RadioGroup
            name="aggregation-picker"
            inline
            appearance="picker"
            value={resolution}
            onChange={newResolution =>
              setResolution(newResolution as TimeResolution)
            }
          >
            <Radio value="daily">{t('audienceFilter.daily')}</Radio>
            <Radio value="monthly">{t('audienceFilter.monthly')}</Radio>
          </RadioGroup>
        </Col>

        <Col
          xs={24}
          xl={6}
        >
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
            value={apiFilter.memberPlanIds}
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
                label={t('audienceFilter.chart')}
                onChange={chart =>
                  setComponentFilter({ ...componentFilter, chart })
                }
              />
            </ToggleContainer>
            <ToggleContainer>
              <Toggle
                checked={componentFilter.table}
                label={t('audienceFilter.table')}
                onChange={table =>
                  setComponentFilter({ ...componentFilter, table })
                }
              />
            </ToggleContainer>

            <ActionContainer>
              <Button
                appearance="ghost"
                size="sm"
                startIcon={<MdLink />}
                onClick={copyPermalink}
              >
                {t('audienceFilter.copyPermalink')}
              </Button>

              <Whisper
                trigger={['hover', 'focus']}
                placement="rightStart"
                speaker={
                  <HelpPopover>
                    <p>{t('audienceFilter.permalinkHelpWhat')}</p>
                    <p>{t('audienceFilter.permalinkHelpWhy')}</p>
                    <p>{t('audienceFilter.permalinkHelpExample')}</p>
                  </HelpPopover>
                }
              >
                <InfoTrigger
                  aria-label={t('audienceFilter.permalinkHelpLabel')}
                />
              </Whisper>
            </ActionContainer>
          </ComponentFilterContainer>
        </Col>

        {/* filter data */}
        <Col
          xs={24}
          xl={14}
        >
          <Panel
            header={t('audienceFilter.panelHeader')}
            bordered
          >
            <Row>
              {Object.keys(clientFilter).map((filterKey, filterIndex) => (
                <Col
                  xs={24}
                  xl={12}
                  key={filterIndex}
                >
                  <AudienceFilterToggle
                    filterKey={filterKey as keyof AudienceClientFilter}
                    clientFilter={clientFilter}
                    setClientFilter={setClientFilter}
                  />
                </Col>
              ))}
            </Row>
          </Panel>
        </Col>
      </Row>
    </Grid>
  );
}
