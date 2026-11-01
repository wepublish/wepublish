import { FieldLabel, FieldProps } from '@puckeditor/core';
import { BlockTimingButton, describeTiming } from '@wepublish/ui/editor';
import { ReactNode, Ref, useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuCalendarClock,
  LuEye,
  LuEyeOff,
  LuMonitorSmartphone,
  LuX,
} from 'react-icons/lu';

import {
  BreakpointToggleList,
  ShowAllBreakpointsButton,
} from '../visibility/visibility.component';
import {
  useBreakpointVisibility,
  useFirstControlFocus,
} from '../visibility/visibility.hooks';
import {
  VisibilitySummary,
  VisibilitySummaryRow,
  VisibilityTextButton,
  VisuallyHiddenInput,
} from '../visibility/visibility.styles';
import {
  BlockVisibilityField,
  BlockVisibilityValue,
  isTimed,
  setBlockVisibility,
} from './block-visibility.field';
import {
  BlockScheduleActions,
  BlockStatusOption,
  BlockStatusOptions,
  VisibilitySectionCard,
  VisibilitySectionDescription,
  VisibilitySectionHeader,
  VisibilitySectionHeading,
  VisibilitySectionIcon,
  VisibilitySections,
  VisibilitySectionTitle,
} from './block-visibility.styles';

export type VisibilitySectionProps = {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  summary: ReactNode;
  action?: ReactNode;
  restricted: boolean;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export const VisibilitySection = ({
  id,
  icon,
  title,
  description,
  summary,
  action,
  restricted,
  children,
  ref,
}: VisibilitySectionProps) => (
  <VisibilitySectionCard
    ref={ref}
    role="group"
    aria-labelledby={`${id}-title`}
    aria-describedby={`${id}-description ${id}-summary`}
  >
    <VisibilitySectionHeader>
      <VisibilitySectionIcon
        restricted={restricted}
        aria-hidden
      >
        {icon}
      </VisibilitySectionIcon>

      <VisibilitySectionHeading>
        <VisibilitySectionTitle id={`${id}-title`}>
          {title}
        </VisibilitySectionTitle>

        <VisibilitySectionDescription id={`${id}-description`}>
          {description}
        </VisibilitySectionDescription>
      </VisibilitySectionHeading>
    </VisibilitySectionHeader>

    {children}

    <VisibilitySummaryRow>
      <VisibilitySummary
        id={`${id}-summary`}
        aria-live="polite"
      >
        {summary}
      </VisibilitySummary>

      {action}
    </VisibilitySummaryRow>
  </VisibilitySectionCard>
);

export type BlockStatusToggleProps = {
  name: string;
  labelledBy: string;
  hidden: boolean;
  onChange: (hidden: boolean) => void;
  readOnly?: boolean;
};

export const BlockStatusToggle = ({
  name,
  labelledBy,
  hidden,
  onChange,
  readOnly,
}: BlockStatusToggleProps) => {
  const { t } = useTranslation();
  const options = [
    {
      hidden: false,
      value: 'visible',
      label: t('puck.blockVisibility.visible'),
      Icon: LuEye,
    },
    {
      hidden: true,
      value: 'hidden',
      label: t('puck.blockVisibility.hidden'),
      Icon: LuEyeOff,
    },
  ];

  return (
    <BlockStatusOptions
      role="radiogroup"
      aria-labelledby={labelledBy}
    >
      {options.map(({ Icon, ...option }) => {
        const selected = option.hidden === hidden;

        return (
          <BlockStatusOption
            key={option.value}
            selectedOption={selected}
            locked={!!readOnly}
          >
            <VisuallyHiddenInput
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              disabled={readOnly}
              onChange={() => onChange(option.hidden)}
            />

            <Icon aria-hidden />
            {option.label}
          </BlockStatusOption>
        );
      })}
    </BlockStatusOptions>
  );
};

export type BlockVisibilityFieldRenderProps = FieldProps<
  BlockVisibilityField,
  BlockVisibilityValue | undefined
> & {
  name: string;
};

export const BlockVisibilityFieldRender = ({
  field,
  name,
  value,
  onChange,
  readOnly,
}: BlockVisibilityFieldRenderProps) => {
  const { t, i18n } = useTranslation();
  const id = useId();
  const current = value ?? {};
  const label = field.label ?? t('puck.blockVisibility.visibility');
  const timed = isTimed(current.timings);
  const {
    ranges,
    hidden: hiddenBreakpoints,
    summary: breakpointSummary,
  } = useBreakpointVisibility(current.breakpoints);
  const { ref: scheduleRef, focusFirstControl: focusSchedule } =
    useFirstControlFocus<HTMLDivElement>();
  const { ref: sizesRef, focusFirstControl: focusSizes } =
    useFirstControlFocus<HTMLDivElement>();

  const change = (next: BlockVisibilityValue) =>
    onChange(setBlockVisibility(value, next));

  const clearSchedule = () => {
    focusSchedule();
    change({ timings: undefined });
  };

  const showAllSizes = () => {
    focusSizes();
    change({ breakpoints: undefined });
  };

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <VisibilitySections
        role="group"
        aria-label={label}
      >
        <VisibilitySection
          id={`${id}-status`}
          icon={current.disabled ? <LuEyeOff /> : <LuEye />}
          title={t('puck.blockVisibility.status')}
          description={t('puck.blockVisibility.statusDescription')}
          summary={
            current.disabled ?
              t('puck.blockVisibility.statusHidden')
            : t('puck.blockVisibility.statusShown')
          }
          restricted={!!current.disabled}
        >
          <BlockStatusToggle
            name={`${name}-status`}
            labelledBy={`${id}-status-title`}
            hidden={!!current.disabled}
            readOnly={readOnly}
            onChange={hidden => change({ disabled: hidden || undefined })}
          />
        </VisibilitySection>

        <VisibilitySection
          ref={scheduleRef}
          id={`${id}-schedule`}
          icon={<LuCalendarClock />}
          title={t('puck.blockVisibility.schedule')}
          description={t('puck.blockVisibility.scheduleDescription')}
          summary={describeTiming(
            current.timings,
            (key, options) => t(key, options ?? {}) as string,
            i18n?.language
          )}
          restricted={timed}
          action={
            !readOnly &&
            timed && (
              <VisibilityTextButton
                type="button"
                onClick={clearSchedule}
              >
                <LuX aria-hidden />
                {t('puck.blockVisibility.clear')}
              </VisibilityTextButton>
            )
          }
        >
          <BlockScheduleActions>
            <BlockTimingButton
              label={t('puck.blockVisibility.editSchedule')}
              timing={current.timings}
              disabled={readOnly}
              onChange={timings => change({ timings })}
            />
          </BlockScheduleActions>
        </VisibilitySection>

        <VisibilitySection
          ref={sizesRef}
          id={`${id}-sizes`}
          icon={<LuMonitorSmartphone />}
          title={t('puck.blockVisibility.screenSizes')}
          description={t('puck.blockVisibility.screenSizesDescription')}
          summary={breakpointSummary}
          restricted={hiddenBreakpoints.length > 0}
          action={
            !readOnly &&
            hiddenBreakpoints.length > 0 && (
              <ShowAllBreakpointsButton onClick={showAllSizes} />
            )
          }
        >
          <BreakpointToggleList
            name={`${name}-breakpoints`}
            ranges={ranges}
            value={current.breakpoints}
            readOnly={readOnly}
            onChange={breakpoints => change({ breakpoints })}
          />
        </VisibilitySection>
      </VisibilitySections>
    </FieldLabel>
  );
};
