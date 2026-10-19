import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { BlockTimingInput, Weekday } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSchedule } from 'react-icons/md';

import { CalendarTimeInput } from './datePicker';
import { DateRange, DateRangeFilter } from './dateRangeFilter';
import { IconButtonTooltip } from './iconButtonTooltip';

const WEEKDAYS = [
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
  Weekday.Sunday,
];

const DEFAULT_TIME = '00:00';

const startOfDay = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return start;
};

const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return end;
};

export const timingDateRange = ({ from, to }: DateRange) => ({
  from: from ? startOfDay(from).toISOString() : null,
  to: to ? endOfDay(to).toISOString() : null,
});

export const dateRangeOf = (
  timing: Pick<BlockTimingInput, 'from' | 'to'>
): DateRange => ({
  from: timing.from ? new Date(timing.from) : null,
  to: timing.to ? new Date(timing.to) : null,
});

const Window = styled(DialogContent)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Weekdays = styled(ToggleButtonGroup)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const Actions = styled(DialogActions)`
  justify-content: space-between;
`;

type Translate = (key: string, options?: Record<string, unknown>) => string;

const timingKey = (timing: BlockTimingInput | null | undefined) =>
  JSON.stringify(timing ?? null);

export const describeTiming = (
  timing: BlockTimingInput | null | undefined,
  t: Translate,
  locale?: string
) => {
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
      new Date(date)
    );
  const list = (items: string[]) =>
    new Intl.ListFormat(locale, { type: 'conjunction' }).format(items);
  const conditions: string[] = [];

  if (timing?.timeOfDay && timing.timeOfDay.from === timing.timeOfDay.to) {
    return t('blockTiming.summary.never');
  }

  if (timing?.from && timing?.to) {
    conditions.push(
      t('blockTiming.summary.between', {
        from: formatDate(timing.from),
        to: formatDate(timing.to),
      })
    );
  } else if (timing?.from) {
    conditions.push(
      t('blockTiming.summary.since', { from: formatDate(timing.from) })
    );
  } else if (timing?.to) {
    conditions.push(
      t('blockTiming.summary.until', { to: formatDate(timing.to) })
    );
  }

  const weekdays = timing?.weekdays ?? [];

  if (weekdays.length && weekdays.length < WEEKDAYS.length) {
    conditions.push(
      t('blockTiming.summary.days', {
        days: list(weekdays.map(weekday => t(`weekday.${weekday}`))),
      })
    );
  }

  if (timing?.timeOfDay) {
    conditions.push(
      t('blockTiming.summary.hours', {
        from: timing.timeOfDay.from,
        to: timing.timeOfDay.to,
      })
    );
  }

  return conditions.length ?
      t('blockTiming.summary.shows', { conditions: conditions.join(', ') })
    : t('blockTiming.summary.always');
};

export const isTimed = (timing: BlockTimingInput | null | undefined) =>
  !!(
    timing?.from ||
    timing?.to ||
    timing?.weekdays?.length ||
    timing?.timeOfDay
  );

export interface BlockTimingButtonProps {
  timing: BlockTimingInput | null | undefined;
  onChange: (timing: BlockTimingInput | null) => void;
  shouldDisplay?: boolean | null;
  disabled?: boolean;
}

export function BlockTimingButton({
  timing,
  onChange,
  shouldDisplay,
  disabled,
}: BlockTimingButtonProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const [openedWith, setOpenedWith] = useState(timingKey(timing));
  const window = timing ?? {};
  const isShowing = shouldDisplay !== false;
  const isEdited = timingKey(timing) !== openedWith;
  const neverShows =
    !!window.timeOfDay && window.timeOfDay.from === window.timeOfDay.to;

  const changeWeekdays = (weekdays: Weekday[]) =>
    onChange({
      ...window,
      weekdays: WEEKDAYS.filter(weekday => weekdays.includes(weekday)),
    });

  const changeTimeOfDay = (edge: 'from' | 'to', time: string) =>
    onChange({
      ...window,
      timeOfDay: {
        from: window.timeOfDay?.from ?? DEFAULT_TIME,
        to: window.timeOfDay?.to ?? DEFAULT_TIME,
        [edge]: time,
      },
    });

  return (
    <>
      <IconButtonTooltip
        caption={t(
          isTimed(timing) && !isShowing ?
            'blockTiming.offAir'
          : 'blockList.timeBlock'
        )}
      >
        <IconButton
          size="small"
          aria-label={t('blockList.timeBlock')}
          color={
            !isTimed(timing) ? 'default'
            : isShowing ?
              'primary'
            : 'warning'
          }
          data-timed={isTimed(timing) ? 'true' : 'false'}
          data-showing={isShowing ? 'true' : 'false'}
          disabled={disabled}
          onClick={() => {
            setOpenedWith(timingKey(timing));
            setOpen(true);
          }}
        >
          <MdSchedule />
        </IconButton>
      </IconButtonTooltip>

      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('blockTiming.title')}</DialogTitle>

        <Window>
          <Alert
            severity={neverShows ? 'error' : 'info'}
            icon={<MdSchedule />}
            role="status"
          >
            {describeTiming(
              timing,
              (key, options) => t(key, options ?? {}) as string,
              i18n?.language
            )}
          </Alert>

          {isTimed(timing) && !isShowing && !isEdited && (
            <Alert severity="warning">{t('blockTiming.offAir')}</Alert>
          )}

          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t('blockTiming.dateRange')}
            </FormLabel>

            <Row>
              <DateRangeFilter
                label={t('blockTiming.dateRangeEmpty')}
                value={dateRangeOf(window)}
                onChange={range =>
                  onChange({ ...window, ...timingDateRange(range) })
                }
              />
            </Row>

            <FormHelperText>{t('blockTiming.dateRangeHelp')}</FormHelperText>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t('blockTiming.weekdays')}
            </FormLabel>

            <Weekdays
              size="small"
              color="primary"
              value={window.weekdays ?? []}
              onChange={(_, weekdays: Weekday[]) => changeWeekdays(weekdays)}
            >
              {WEEKDAYS.map(weekday => (
                <ToggleButton
                  key={weekday}
                  value={weekday}
                  aria-label={t(`weekday.${weekday}`)}
                >
                  {t(`weekdayShort.${weekday}`)}
                </ToggleButton>
              ))}
            </Weekdays>

            <FormHelperText>{t('blockTiming.weekdaysHelp')}</FormHelperText>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t('blockTiming.timeOfDay')}
            </FormLabel>

            <Row>
              <Typography aria-hidden>
                {t('blockTiming.timeOfDayFrom')}
              </Typography>

              <CalendarTimeInput
                label={t('blockTiming.timeOfDayFrom')}
                value={window.timeOfDay?.from ?? ''}
                onChange={time => changeTimeOfDay('from', time)}
              />

              <Typography aria-hidden>
                {t('blockTiming.timeOfDayTo')}
              </Typography>

              <CalendarTimeInput
                label={t('blockTiming.timeOfDayTo')}
                value={window.timeOfDay?.to ?? ''}
                onChange={time => changeTimeOfDay('to', time)}
              />

              {window.timeOfDay && (
                <Button
                  size="small"
                  onClick={() => onChange({ ...window, timeOfDay: null })}
                >
                  {t('blockTiming.clearTimeOfDay')}
                </Button>
              )}
            </Row>

            <FormHelperText>
              {t(
                neverShows ?
                  'blockTiming.sameTimes'
                : 'blockTiming.timeOfDayHelp'
              )}
            </FormHelperText>
          </FormControl>
        </Window>

        <Actions>
          <Button
            color="inherit"
            disabled={!isTimed(timing)}
            onClick={() => onChange(null)}
          >
            {t('blockTiming.clear')}
          </Button>

          <Button
            onClick={() => setOpen(false)}
            variant="contained"
          >
            {t('blockTiming.done')}
          </Button>
        </Actions>
      </Dialog>
    </>
  );
}
