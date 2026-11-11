import styled from '@emotion/styled';
import { FormControlLabel, Switch } from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { useAudienceChartColors } from './audience-chart';
import { AudienceClientFilter } from './audience-filter-params';

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-height: 40px;
`;

const Label = styled(FormControlLabel)`
  flex: 1;
  min-width: 0;
  margin: 0;
`;

const Name = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const Swatch = styled.span<{ color?: string }>`
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
`;

const RowEnd = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

interface AudienceFilterToggleProps {
  filterKey: keyof AudienceClientFilter;
  clientFilter: AudienceClientFilter;
  setClientFilter: Dispatch<SetStateAction<AudienceClientFilter>>;
}

export function AudienceFilterToggle({
  filterKey,
  clientFilter,
  setClientFilter,
}: AudienceFilterToggleProps) {
  const { t } = useTranslation();
  const chartColors = useAudienceChartColors();

  const chartColor =
    typeof chartColors[filterKey] === 'string' ?
      chartColors[filterKey]
    : chartColors[filterKey][0];

  return (
    <Row>
      <Label
        control={
          <Switch
            size="small"
            checked={clientFilter[filterKey]}
            onChange={(_event, checked: boolean) =>
              setClientFilter({
                ...clientFilter,
                [filterKey]: checked,
              })
            }
          />
        }
        label={
          <Name>
            <Swatch color={chartColor} />
            {t(`audience.legend.${filterKey}`)}
          </Name>
        }
      />

      <RowEnd data-row-end>
        <InfoTooltip
          text={t(`audience.legend.info.${filterKey}`)}
          placement="left-start"
        />
      </RowEnd>
    </Row>
  );
}
