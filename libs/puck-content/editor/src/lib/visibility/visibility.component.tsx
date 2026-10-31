import { Breakpoint } from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  LuCheck,
  LuLaptop,
  LuMonitor,
  LuRotateCcw,
  LuSmartphone,
  LuTablet,
  LuTabletSmartphone,
  LuTv,
} from 'react-icons/lu';

import {
  BreakpointRange,
  formatBreakpointRange,
  isHiddenOn,
  toggleBreakpoint,
  VisibilityField,
  VisibilityValue,
} from './visibility.field';
import {
  useBreakpointVisibility,
  useFirstControlFocus,
} from './visibility.hooks';
import {
  BreakpointCheck,
  BreakpointList,
  BreakpointName,
  BreakpointOption,
  BreakpointWidth,
  VisibilityControl,
  VisibilitySummary,
  VisibilitySummaryRow,
  VisibilityTextButton,
  VisuallyHiddenInput,
} from './visibility.styles';

const breakpointIcons: Partial<Record<Breakpoint, IconType>> = {
  xs: LuSmartphone,
  sm: LuTabletSmartphone,
  md: LuTablet,
  lg: LuLaptop,
  xl: LuMonitor,
};

export type BreakpointToggleListProps = {
  name: string;
  ranges: BreakpointRange[];
  value: VisibilityValue | undefined;
  onChange: (value: VisibilityValue | undefined) => void;
  readOnly?: boolean;
};

export const BreakpointToggleList = ({
  name,
  ranges,
  value,
  onChange,
  readOnly,
}: BreakpointToggleListProps) => {
  const breakpoints = ranges.map(range => range.breakpoint);

  return (
    <BreakpointList>
      {ranges.map(range => {
        const Icon = breakpointIcons[range.breakpoint] ?? LuTv;
        const width = formatBreakpointRange(range);
        const shown = !isHiddenOn(value, range.breakpoint);

        return (
          <li key={range.breakpoint}>
            <BreakpointOption
              shown={shown}
              locked={!!readOnly}
            >
              <VisuallyHiddenInput
                type="checkbox"
                name={name}
                value={range.breakpoint}
                aria-label={`${range.breakpoint} · ${width}`}
                checked={shown}
                disabled={readOnly}
                onChange={() =>
                  onChange(
                    toggleBreakpoint(value, range.breakpoint, breakpoints)
                  )
                }
              />

              <Icon aria-hidden />
              <BreakpointName>{range.breakpoint}</BreakpointName>
              <BreakpointWidth>{width}</BreakpointWidth>

              <BreakpointCheck
                shown={shown}
                aria-hidden
              >
                {shown && <LuCheck />}
              </BreakpointCheck>
            </BreakpointOption>
          </li>
        );
      })}
    </BreakpointList>
  );
};

export type ShowAllBreakpointsButtonProps = {
  onClick: () => void;
};

export const ShowAllBreakpointsButton = ({
  onClick,
}: ShowAllBreakpointsButtonProps) => {
  const { t } = useTranslation();

  return (
    <VisibilityTextButton
      type="button"
      onClick={onClick}
    >
      <LuRotateCcw aria-hidden />
      {t('', 'All sizes')}
    </VisibilityTextButton>
  );
};

export type VisibilityFieldRenderProps = FieldProps<
  VisibilityField,
  VisibilityValue | undefined
> & {
  name: string;
};

export const VisibilityFieldRender = ({
  field,
  name,
  value,
  onChange,
  readOnly,
}: VisibilityFieldRenderProps) => {
  const { t } = useTranslation();
  const { ranges, hidden, summary } = useBreakpointVisibility(value);
  const { ref: controlRef, focusFirstControl } =
    useFirstControlFocus<HTMLDivElement>();
  const label = field.label ?? t('', 'Screen sizes');

  const showAll = () => {
    focusFirstControl();
    onChange(undefined);
  };

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <VisibilityControl
        ref={controlRef}
        role="group"
        aria-label={label}
      >
        <BreakpointToggleList
          name={name}
          ranges={ranges}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
        />

        <VisibilitySummaryRow>
          <VisibilitySummary aria-live="polite">{summary}</VisibilitySummary>

          {!readOnly && hidden.length > 0 && (
            <ShowAllBreakpointsButton onClick={showAll} />
          )}
        </VisibilitySummaryRow>
      </VisibilityControl>
    </FieldLabel>
  );
};
