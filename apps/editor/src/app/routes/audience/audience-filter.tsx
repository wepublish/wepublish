import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Switch,
} from '@mui/material';
import { MemberPlanListDocument } from '@wepublish/editor/api';
import {
  ClickPopover,
  enqueueSnackbar,
  InfoTrigger,
} from '@wepublish/ui/editor';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';
import type { DateRangePickerProps } from 'rsuite';
import { DateRangePicker, TagPicker } from 'rsuite';

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

const HelpPopover = styled('div')`
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

      enqueueSnackbar(t('audienceFilter.permalinkCopied'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } catch {
      enqueueSnackbar(t('audienceFilter.permalinkCopyFailed'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
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
    <Grid
      container
      spacing={2}
      style={{ width: '100%' }}
    >
      <Grid
        container
        spacing={2}
      >
        {/* select date range */}
        <Grid size={{ xs: 12, xl: 2 }}>
          <RadioGroup
            name="aggregation-picker"
            row
            value={resolution}
            onChange={(_event, newResolution) =>
              setResolution(newResolution as TimeResolution)
            }
          >
            <FormControlLabel
              value="daily"
              control={<Radio />}
              label={t('audienceFilter.daily')}
            />
            <FormControlLabel
              value="monthly"
              control={<Radio />}
              label={t('audienceFilter.monthly')}
            />
          </RadioGroup>
        </Grid>

        <Grid size={{ xs: 12, xl: 3 }}>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={componentFilter.chart}
                    onChange={(_event, chart) =>
                      setComponentFilter({ ...componentFilter, chart })
                    }
                  />
                }
                label={t('audienceFilter.chart')}
              />
            </ToggleContainer>
            <ToggleContainer>
              <FormControlLabel
                control={
                  <Switch
                    checked={componentFilter.table}
                    onChange={(_event, table) =>
                      setComponentFilter({ ...componentFilter, table })
                    }
                  />
                }
                label={t('audienceFilter.table')}
              />
            </ToggleContainer>

            <ActionContainer>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MdLink />}
                onClick={copyPermalink}
              >
                {t('audienceFilter.copyPermalink')}
              </Button>

              <ClickPopover
                trigger={
                  <InfoTrigger
                    aria-label={t('audienceFilter.permalinkHelpLabel')}
                  />
                }
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <HelpPopover>
                  <p>{t('audienceFilter.permalinkHelpWhat')}</p>
                  <p>{t('audienceFilter.permalinkHelpWhy')}</p>
                  <p>{t('audienceFilter.permalinkHelpExample')}</p>
                </HelpPopover>
              </ClickPopover>
            </ActionContainer>
          </ComponentFilterContainer>
        </Grid>

        {/* filter data */}
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card variant="outlined">
            <CardHeader title={t('audienceFilter.panelHeader')} />

            <CardContent>
              <Grid
                container
                spacing={2}
              >
                {Object.keys(clientFilter).map((filterKey, filterIndex) => (
                  <Grid
                    size={{ xs: 12, xl: 6 }}
                    key={filterIndex}
                  >
                    <AudienceFilterToggle
                      filterKey={filterKey as keyof AudienceClientFilter}
                      clientFilter={clientFilter}
                      setClientFilter={setClientFilter}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
