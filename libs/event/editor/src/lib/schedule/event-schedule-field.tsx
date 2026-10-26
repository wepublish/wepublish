import styled from '@emotion/styled';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { EventScheduleType } from '@wepublish/editor/api';
import { lastSchedulableDay } from '@wepublish/event/schedule';
import { FieldProps, ListInput } from '@wepublish/ui/editor';
import { useId } from 'react';
import {
  Controller,
  RefCallBack,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';
import { formatCalendarDay, formatWeekday } from '../event-list/event-format';
import { OccurrencePreview, previewOccurrences } from './occurrence-preview';
import {
  duplicateExplicitDate,
  emptyExplicitDate,
  ExplicitDateForm,
  ISO_WEEKDAYS,
} from './schedule-form';
import { describeScheduleProblem } from './schedule-problems';

const MODES = [
  EventScheduleType.Continuous,
  EventScheduleType.Weekly,
  EventScheduleType.Explicit,
] as const;

type SpanMode = 'continuous' | 'weekly';

type MessageAt = (field: string) => string | undefined;

const Modes = styled(RadioGroup)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Mode = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Example = styled(Typography)`
  margin-left: ${({ theme }) => theme.spacing(4)};
`;

const Panel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-left: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

const Pair = styled.div`
  display: grid;
  grid-template-columns: minmax(9rem, 3fr) minmax(7rem, 2fr);
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: start;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: start;
`;

const WeekDays = styled(FormGroup)`
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const pickerLabel = { inputLabel: { shrink: true } } as const;

const bind = ({
  name,
  value,
  onChange,
  onBlur,
  ref,
}: {
  name: string;
  value: string;
  onChange: (...event: unknown[]) => void;
  onBlur: () => void;
  ref: RefCallBack;
}) => ({ name, value, onChange, onBlur, inputRef: ref });

function SpanFields({
  mode,
  messageAt,
  horizon,
}: {
  mode: SpanMode;
  messageAt: MessageAt;
  horizon: string;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const dateFromError = messageAt(`${mode}.dateFrom`);
  const dateToError = messageAt(`${mode}.dateTo`);
  const openingTimeError = messageAt(`${mode}.openingTime`);

  return (
    <>
      <Pair>
        <Controller
          control={control}
          name={`schedule.${mode}.dateFrom`}
          render={({ field }) => (
            <TextField
              {...bind(field)}
              type="date"
              label={t(`agenda.schedule.span.${mode}.dateFrom`)}
              error={!!dateFromError}
              helperText={dateFromError}
              slotProps={pickerLabel}
            />
          )}
        />
        <Controller
          control={control}
          name={`schedule.${mode}.timeFrom`}
          render={({ field }) => (
            <TextField
              {...bind(field)}
              type="time"
              label={t(`agenda.schedule.span.${mode}.timeFrom`)}
              slotProps={pickerLabel}
            />
          )}
        />
      </Pair>

      <Pair>
        <Controller
          control={control}
          name={`schedule.${mode}.dateTo`}
          render={({ field }) => (
            <TextField
              {...bind(field)}
              type="date"
              label={t(`agenda.schedule.span.${mode}.dateTo`)}
              error={!!dateToError}
              helperText={dateToError ?? horizon}
              slotProps={pickerLabel}
            />
          )}
        />
        <Controller
          control={control}
          name={`schedule.${mode}.timeTo`}
          render={({ field }) => (
            <TextField
              {...bind(field)}
              type="time"
              label={t(`agenda.schedule.span.${mode}.timeTo`)}
              helperText={
                mode === 'weekly' ? t('agenda.schedule.overnight') : undefined
              }
              slotProps={pickerLabel}
            />
          )}
        />
      </Pair>

      <Pair>
        <Controller
          control={control}
          name={`schedule.${mode}.openingTime`}
          render={({ field }) => (
            <TextField
              {...bind(field)}
              type="time"
              label={t('agenda.schedule.openingTime')}
              error={!!openingTimeError}
              helperText={openingTimeError ?? t('agenda.schedule.optional')}
              slotProps={pickerLabel}
            />
          )}
        />
      </Pair>
    </>
  );
}

function WeekDayToggles({ messageAt }: { messageAt: MessageAt }) {
  const { t, i18n } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const error = messageAt('weekly.weekDays');

  return (
    <FormControl
      component="fieldset"
      error={!!error}
    >
      <FormLabel component="legend">{t('agenda.schedule.weekDays')}</FormLabel>
      <Controller
        control={control}
        name="schedule.weekly.weekDays"
        render={({ field }) => (
          <WeekDays row>
            {ISO_WEEKDAYS.map(day => (
              <FormControlLabel
                key={day}
                label={formatWeekday(day, i18n.language, 'short')}
                control={
                  <Checkbox
                    checked={field.value.includes(day)}
                    onChange={(_event, checked) =>
                      field.onChange(
                        checked ?
                          [...field.value, day].sort((a, b) => a - b)
                        : field.value.filter(picked => picked !== day)
                      )
                    }
                    slotProps={{
                      input: {
                        'aria-label': formatWeekday(day, i18n.language, 'long'),
                      },
                    }}
                  />
                }
              />
            ))}
          </WeekDays>
        )}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function ExplicitDateRow({
  position,
  value,
  onChange,
}: FieldProps<ExplicitDateForm> & { position: number }) {
  const { t } = useTranslation();

  const change =
    (key: keyof ExplicitDateForm) => (event: { target: { value: string } }) =>
      onChange({ ...value, [key]: event.target.value });

  const field = (key: keyof ExplicitDateForm, type: 'date' | 'time') => (
    <TextField
      size="small"
      type={type}
      value={value[key]}
      onChange={change(key)}
      label={t(`agenda.schedule.row.${key}`)}
      slotProps={{
        ...pickerLabel,
        htmlInput: {
          'aria-label': t(
            `agenda.schedule.row${key.charAt(0).toUpperCase()}${key.slice(1)}`,
            { position }
          ),
        },
      }}
    />
  );

  return (
    <Row>
      {field('date', 'date')}
      {field('timeFrom', 'time')}
      {field('timeTo', 'time')}
      {field('openingTime', 'time')}
    </Row>
  );
}

function ExplicitDates({
  messageAt,
  horizon,
}: {
  messageAt: MessageAt;
  horizon: string;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const error = messageAt('explicit');

  return (
    <>
      <Controller
        control={control}
        name="schedule.explicit"
        render={({ field }) => (
          <ListInput<ExplicitDateForm>
            value={field.value}
            onChange={field.onChange}
            defaultValue={emptyExplicitDate()}
            showIndex
            dense
            addLabel={t('agenda.schedule.addDate')}
            duplicateLastLabel={t('agenda.schedule.duplicateLast')}
            duplicateValue={duplicateExplicitDate}
          >
            {({ value, onChange }) => (
              <ExplicitDateRow
                position={field.value.findIndex(row => row.value === value) + 1}
                value={value}
                onChange={onChange}
              />
            )}
          </ListInput>
        )}
      />
      <FormHelperText error={!!error}>
        {error ?? `${t('agenda.schedule.overnight')} ${horizon}`}
      </FormHelperText>
    </>
  );
}

function Count({
  mode,
  preview,
}: {
  mode: EventScheduleType;
  preview: OccurrencePreview;
}) {
  const { t } = useTranslation();

  const text =
    preview.count === null ? ''
    : mode === EventScheduleType.Weekly ?
      t('agenda.schedule.countWeekly', {
        count: preview.count,
        from: preview.timeFrom,
        to: preview.timeTo,
      })
    : t('agenda.schedule.countExplicit', { count: preview.count });

  return (
    <Typography
      data-testid="schedule-count"
      role="status"
      aria-live="polite"
      variant="body2"
    >
      {text}
    </Typography>
  );
}

export function EventScheduleField({ now }: { now: Date }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const { control } = useFormContext<EventFormValues>();
  const schedule = useWatch({ control, name: 'schedule' });
  const { isSubmitted, dirtyFields } = useFormState({
    control,
    name: 'schedule',
  });

  const preview = previewOccurrences(schedule, now);
  const messages =
    isSubmitted || dirtyFields.schedule ?
      preview.problems.map(problem =>
        describeScheduleProblem(
          problem,
          schedule.scheduleType,
          now,
          i18n.language
        )
      )
    : [];

  const messageAt: MessageAt = field =>
    messages
      .filter(message => message.field === field)
      .map(message => t(message.key, message.values))
      .join(' ') || undefined;

  const horizon = t('agenda.schedule.horizon', {
    date: formatCalendarDay(lastSchedulableDay(now), i18n.language),
  });

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">{t('agenda.schedule.legend')}</FormLabel>

      <Controller
        control={control}
        name="schedule.scheduleType"
        render={({ field }) => (
          <Modes
            name={field.name}
            value={field.value}
            onChange={(_event, value) => field.onChange(value)}
          >
            {MODES.map(mode => (
              <Mode key={mode}>
                <FormControlLabel
                  value={mode}
                  label={t(`agenda.schedule.modes.${mode}.label`)}
                  control={
                    <Radio
                      slotProps={{
                        input: { 'aria-describedby': `${id}-${mode}` },
                      }}
                    />
                  }
                />
                <Example
                  id={`${id}-${mode}`}
                  variant="body2"
                  color="text.secondary"
                >
                  {t(`agenda.schedule.modes.${mode}.example`)}
                </Example>

                {field.value === mode && (
                  <Panel>
                    {mode === EventScheduleType.Continuous && (
                      <SpanFields
                        mode="continuous"
                        messageAt={messageAt}
                        horizon={horizon}
                      />
                    )}

                    {mode === EventScheduleType.Weekly && (
                      <>
                        <WeekDayToggles messageAt={messageAt} />
                        <SpanFields
                          mode="weekly"
                          messageAt={messageAt}
                          horizon={horizon}
                        />
                        <Count
                          mode={mode}
                          preview={preview}
                        />
                      </>
                    )}

                    {mode === EventScheduleType.Explicit && (
                      <>
                        <ExplicitDates
                          messageAt={messageAt}
                          horizon={horizon}
                        />
                        <Count
                          mode={mode}
                          preview={preview}
                        />
                      </>
                    )}
                  </Panel>
                )}
              </Mode>
            ))}
          </Modes>
        )}
      />
    </FormControl>
  );
}
