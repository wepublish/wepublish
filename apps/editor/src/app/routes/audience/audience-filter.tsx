import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  FormLabel,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { MemberPlanListDocument } from '@wepublish/editor/api';
import {
  ClickPopover,
  DateRangeFilter,
  DateRangePreset,
  enqueueSnackbar,
  InfoTrigger,
} from '@wepublish/ui/editor';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';

import {
  AudienceApiFilter,
  AudienceClientFilter,
  AudienceComponentFilter,
  DATE_RANGE_PRESET_KEYS,
  DateRange,
  dateRangeForPreset,
  TimeResolution,
} from './audience-filter-params';
import { AudienceFilterToggle } from './audience-filter-toggle';

const Panel = styled(Card)`
  width: 100%;
`;

const PanelContent = styled(CardContent)`
  &:last-child {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;

const Series = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  align-content: start;
`;

const SeriesRows = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Controls = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  align-content: start;
`;

const Choices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Choice = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  justify-items: start;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
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

  const rangePresets = useMemo<DateRangePreset[]>(
    () =>
      DATE_RANGE_PRESET_KEYS.map(key => ({
        label: t(`audienceFilter.range${key[0].toUpperCase()}${key.slice(1)}`),
        value: dateRangeForPreset(key),
      })),
    [t]
  );

  return (
    <Panel variant="outlined">
      <PanelContent>
        <Grid
          container
          spacing={3}
        >
          <Grid size={{ xs: 12, lg: 5 }}>
            <Controls>
              <Choices>
                <Choice>
                  <FormLabel component="legend">
                    {t('audienceFilter.resolution')}
                  </FormLabel>

                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    color="primary"
                    value={resolution}
                    aria-label={t('audienceFilter.resolution')}
                    onChange={(_event, newResolution: TimeResolution | null) =>
                      newResolution && setResolution(newResolution)
                    }
                  >
                    <ToggleButton value="daily">
                      {t('audienceFilter.daily')}
                    </ToggleButton>
                    <ToggleButton value="monthly">
                      {t('audienceFilter.monthly')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Choice>

                <Choice>
                  <FormLabel component="legend">
                    {t('audienceFilter.view')}
                  </FormLabel>

                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    color="primary"
                    value={componentFilter.table ? 'table' : 'chart'}
                    aria-label={t('audienceFilter.view')}
                    onChange={(_event, view: 'chart' | 'table' | null) =>
                      view &&
                      setComponentFilter({
                        ...componentFilter,
                        chart: view === 'chart',
                        table: view === 'table',
                      })
                    }
                  >
                    <ToggleButton value="chart">
                      {t('audienceFilter.chart')}
                    </ToggleButton>
                    <ToggleButton value="table">
                      {t('audienceFilter.table')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Choice>
              </Choices>

              <DateRangeFilter
                label={t('audienceFilter.dateRange')}
                presets={rangePresets}
                value={{
                  from: apiFilter.dateRange?.[0] ?? null,
                  to: apiFilter.dateRange?.[1] ?? null,
                }}
                onChange={({ from, to }) =>
                  setApiFilter({
                    dateRange: from && to ? ([from, to] as DateRange) : null,
                  })
                }
              />

              <Autocomplete
                multiple
                disableCloseOnSelect
                options={memberPlansForPicker.map(plan => plan.value)}
                getOptionLabel={id =>
                  memberPlansForPicker.find(plan => plan.value === id)?.label ??
                  id
                }
                value={apiFilter.memberPlanIds ?? []}
                onChange={(_event, newMemberPlanIds) =>
                  setApiFilter({ memberPlanIds: newMemberPlanIds })
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('audienceFilter.subscriptionPlans')}
                    placeholder={t('audienceFilter.filterSubscriptionPlans')}
                  />
                )}
              />

              <Actions>
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
                    <Typography>
                      {t('audienceFilter.permalinkHelpWhat')}
                    </Typography>
                    <Typography>
                      {t('audienceFilter.permalinkHelpWhy')}
                    </Typography>
                    <Typography>
                      {t('audienceFilter.permalinkHelpExample')}
                    </Typography>
                  </HelpPopover>
                </ClickPopover>
              </Actions>
            </Controls>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Series>
              <FormLabel component="legend">
                {t('audienceFilter.panelHeader')}
              </FormLabel>

              <SeriesRows>
                {Object.keys(clientFilter).map(filterKey => (
                  <AudienceFilterToggle
                    key={filterKey}
                    filterKey={filterKey as keyof AudienceClientFilter}
                    clientFilter={clientFilter}
                    setClientFilter={setClientFilter}
                  />
                ))}
              </SeriesRows>
            </Series>
          </Grid>
        </Grid>
      </PanelContent>
    </Panel>
  );
}
