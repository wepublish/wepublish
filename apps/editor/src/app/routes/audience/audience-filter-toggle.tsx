import styled from '@emotion/styled';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfo } from 'react-icons/md';
import { Form as RForm, Toggle, Tooltip, Whisper } from 'rsuite';

import { useAudienceChartColors } from './audience-chart';
import { AudienceClientFilter } from './audience-filter-params';

const { Label } = RForm;

export const ToggleLable = styled(Label)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: ${({ theme }) => theme.spacing(1)};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;

  ${ToggleLable} {
    flex: 0 1 auto;
    min-width: 0;
    padding-left: 0;
  }
`;

const Swatch = styled.span<{ color?: string }>`
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background-color: ${({ color }) => color};
`;

const Info = styled.div`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
`;

const FilterInfo = ({
  text,
  color,
}: {
  text: string;
  color: string | undefined;
}) => (
  <Whisper
    trigger="hover"
    speaker={
      <Tooltip>
        {text.split('\n').map((line, index) => (
          <span
            style={{ display: 'block', paddingBottom: '.5rem' }}
            key={index}
          >
            {line}
          </span>
        ))}
      </Tooltip>
    }
    placement="rightStart"
  >
    <Info>
      <MdInfo
        size={18}
        color={color}
      />
    </Info>
  </Whisper>
);

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
        onChange={(checked: boolean) =>
          setClientFilter({
            ...clientFilter,
            [filterKey]: checked,
          })
        }
      />

      <ToggleLable>
        <Swatch color={chartColor} />
        {t(`audience.legend.${filterKey}`)}
      </ToggleLable>

      <FilterInfo
        text={t(`audience.legend.info.${filterKey}`)}
        color="var(--rs-text-secondary)"
      />
    </ToggleRow>
  );
}
