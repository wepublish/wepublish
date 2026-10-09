import styled from '@emotion/styled';
import { Dispatch, SetStateAction } from 'react';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Toggle } from 'rsuite';

import { useAudienceChartColors } from './audience-chart';
import { AudienceClientFilter } from './audience-filter-params';

const ToggleRow = styled.div`
  padding: 6px 0;
`;

const ToggleLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const Swatch = styled.span<{ color?: string }>`
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background-color: ${({ color }) => color};
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
    <ToggleRow>
      <Toggle
        checked={clientFilter[filterKey as keyof AudienceClientFilter]}
        label={
          <ToggleLabel>
            <Swatch color={chartColor} />
            {t(`audience.legend.${filterKey}`)}
            <InfoTooltip
              text={t(`audience.legend.info.${filterKey}`)}
              placement="rightStart"
            />
          </ToggleLabel>
        }
        onChange={(checked: boolean) =>
          setClientFilter({
            ...clientFilter,
            [filterKey]: checked,
          })
        }
      />
    </ToggleRow>
  );
}
