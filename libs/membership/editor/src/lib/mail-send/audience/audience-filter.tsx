import { useQuery } from '@apollo/client/react';
import {
  MailEmailSegment,
  MailRecipientBase,
  MailSubscriptionState,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { DateRangeFilter } from '@wepublish/ui/editor';
import {
  Autocomplete,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  Typography,
} from '@mui/material';
import { ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldLabel } from '../../field-label';
import { AudienceFilterState, EndedMode, TriState } from './audience-state';
import { MailHistoryFilter } from './mail-history-filter';
import { EmailQualityRefreshButton } from '../email-quality-refresh-button';

export type AudienceFilterProps = {
  state: AudienceFilterState;
  onChange: (patch: Partial<AudienceFilterState>) => void;
  /** Shown under the base choice, e.g. a warning about the chosen template. */
  children?: ReactNode;
  /** The label over the base choice; null when the surroundings name it already. */
  baseLabel?: ReactNode | null;
  /** People of this audience per email status, regardless of the statuses picked. */
  segmentCounts?: { segment: MailEmailSegment; userCount: number }[];
  /** After the statuses were refreshed from the mail provider. */
  onSegmentsRefreshed?: () => void;
};

/** Best to worst; the last two are the people only a letter reaches. */
const EMAIL_SEGMENT_ORDER = [
  MailEmailSegment.Active,
  MailEmailSegment.Unresponsive,
  MailEmailSegment.Unknown,
  MailEmailSegment.Placeholder,
  MailEmailSegment.Dead,
];

/**
 * The controls that narrow an audience: the base, the email segments, what
 * the people were sent, and the subscription or win-back details. Shared by
 * the communication tool and the delivery-mode switch, so both mean the same
 * thing by "Zielgruppe".
 */
export function AudienceFilter({
  state,
  onChange,
  children,
  baseLabel,
  segmentCounts,
  onSegmentsRefreshed,
}: AudienceFilterProps) {
  const { t } = useTranslation();
  const fieldId = useId();
  const labelId = (field: string) => `${fieldId}-${field}`;
  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);

  const isSubscriptionBase = state.base === MailRecipientBase.HasSubscription;
  const isWinBackBase = state.base === MailRecipientBase.EndedSubscription;
  const memberPlans = memberPlanData?.memberPlans.nodes ?? [];

  const triStateSelect = (
    field: string,
    label: ReactNode,
    value: TriState,
    patch: (value: TriState) => Partial<AudienceFilterState>,
    { hint, help }: { hint?: string; help?: string } = {}
  ) => (
    <FormControl fullWidth>
      <FieldLabel
        id={labelId(field)}
        label={label}
        help={help}
      />
      <TextField
        select
        value={value}
        onChange={event =>
          onChange(patch((event.target.value as TriState) ?? 'any'))
        }
        fullWidth
        slotProps={{ select: { labelId: labelId(field) } }}
      >
        <MenuItem value="any">{t('mailSend.any')}</MenuItem>
        <MenuItem value="true">{t('mailSend.yes')}</MenuItem>
        <MenuItem value="false">{t('mailSend.no')}</MenuItem>
      </TextField>
      {hint && <FormHelperText>{hint}</FormHelperText>}
    </FormControl>
  );

  const memberPlanPicker = (
    <FormControl fullWidth>
      <FieldLabel
        id={labelId('member-plans')}
        label={t('mailSend.memberPlans')}
      />
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={memberPlans.map(plan => plan.id)}
        getOptionLabel={option =>
          memberPlans.find(plan => plan.id === option)?.name ?? option
        }
        value={state.memberPlanIDs}
        onChange={(_event, value) =>
          onChange({ memberPlanIDs: value as string[] })
        }
        renderInput={params => (
          <TextField
            {...params}
            placeholder={t('mailSend.memberPlansAll')}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                'aria-labelledby': labelId('member-plans'),
              },
            }}
          />
        )}
      />
    </FormControl>
  );

  return (
    <Stack
      spacing={3}
      sx={{ width: '100%' }}
    >
      <FormControl fullWidth>
        {baseLabel !== null && (
          <FieldLabel
            id={labelId('base')}
            label={baseLabel ?? t('mailSend.base.label')}
          />
        )}
        <RadioGroup
          aria-labelledby={baseLabel !== null ? labelId('base') : undefined}
          value={state.base}
          onChange={(_event, value) =>
            onChange({ base: value as MailRecipientBase })
          }
        >
          {[
            MailRecipientBase.AllUsers,
            MailRecipientBase.HasSubscription,
            MailRecipientBase.NoActiveSubscription,
            MailRecipientBase.EndedSubscription,
          ].map(option => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio />}
              label={
                <>
                  <div>{t(`mailSend.base.${option}`)}</div>
                  <Typography
                    variant="caption"
                    style={{
                      color: 'text.secondary',
                      whiteSpace: 'normal',
                      lineHeight: 1.35,
                    }}
                    sx={{ display: 'block' }}
                  >
                    {t(`mailSend.base.${option}Hint`)}
                  </Typography>
                </>
              }
            />
          ))}
        </RadioGroup>

        {children}
      </FormControl>

      <Divider />
      {/* Placeholder vs real is the `placeholder` segment and its complement,
          so one control covers it. */}
      <FormControl fullWidth>
        <FieldLabel
          id={labelId('email-segments')}
          label={t('mailSend.emailSegments.label')}
        />
        {/* One toggle per status, so the count of each sits on the control
            that picks it. Several picked statuses combine as "or". */}
        <Stack
          role="group"
          aria-labelledby={labelId('email-segments')}
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap', marginTop: 0.5 }}
        >
          {EMAIL_SEGMENT_ORDER.map(segment => {
            const picked = state.emailSegments.includes(segment);
            const people = segmentCounts?.find(
              count => count.segment === segment
            )?.userCount;

            return (
              <ToggleButton
                key={segment}
                value={segment}
                size="small"
                color="primary"
                selected={picked}
                onChange={() =>
                  onChange({
                    emailSegments:
                      picked ?
                        state.emailSegments.filter(item => item !== segment)
                      : [...state.emailSegments, segment],
                  })
                }
                sx={{ textTransform: 'none', textAlign: 'left' }}
              >
                {t(`mailSend.emailSegments.${segment}`)}
                {segmentCounts && `: ${people ?? 0}`}
              </ToggleButton>
            );
          })}
          <EmailQualityRefreshButton onDone={onSegmentsRefreshed} />
        </Stack>
        <FormHelperText>{t('mailSend.emailSegments.hint')}</FormHelperText>
      </FormControl>

      <Divider />
      <MailHistoryFilter
        value={state.mailHistory}
        onChange={mailHistory => onChange({ mailHistory })}
      />

      {isWinBackBase && (
        <>
          <Divider />
          <FormControl fullWidth>
            <FieldLabel
              id={labelId('ended-window')}
              label={t('mailSend.endedWindow.label')}
            />
            <RadioGroup
              aria-labelledby={labelId('ended-window')}
              row
              value={state.endedMode}
              onChange={(_event, value) =>
                onChange({ endedMode: value as EndedMode })
              }
            >
              <FormControlLabel
                value="days"
                control={<Radio />}
                label={t('mailSend.endedWindow.relative')}
              />
              <FormControlLabel
                value="period"
                control={<Radio />}
                label={t('mailSend.endedWindow.period')}
              />
            </RadioGroup>

            {state.endedMode === 'days' ?
              <>
                <TextField
                  type="number"
                  value={state.endedWithinDays}
                  onChange={event => {
                    const parsed = parseInt(event.target.value, 10);

                    if (Number.isFinite(parsed) && parsed > 0) {
                      onChange({ endedWithinDays: parsed });
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: 3650,
                      'aria-label': t('mailSend.endedWindow.relative'),
                    },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {t('mailSend.endedWindow.days')}
                        </InputAdornment>
                      ),
                    },
                  }}
                  style={{ width: 180 }}
                />
                <FormHelperText>
                  {t('mailSend.endedWithinDaysHint')}
                </FormHelperText>
              </>
            : <>
                <DateRangeFilter
                  label={t('mailSend.endedWindow.periodFrom')}
                  disableFuture
                  value={{
                    from: state.endedPeriod?.[0] ?? null,
                    to: state.endedPeriod?.[1] ?? null,
                  }}
                  onChange={({ from, to }) =>
                    onChange({ endedPeriod: from && to ? [from, to] : null })
                  }
                />
                <FormHelperText>
                  {t('mailSend.endedWindow.periodHint')}
                </FormHelperText>
              </>
            }
          </FormControl>

          {memberPlanPicker}
        </>
      )}

      {isSubscriptionBase && (
        <>
          <Divider />
          {memberPlanPicker}

          <FormControl fullWidth>
            <FieldLabel
              id={labelId('state')}
              label={t('mailSend.state.label')}
              help={t('mailSend.stateHelp')}
            />
            <TextField
              select
              value={state.subscriptionState ?? ''}
              onChange={event =>
                onChange({
                  subscriptionState:
                    (event.target.value as MailSubscriptionState) || null,
                })
              }
              fullWidth
              slotProps={{
                select: { displayEmpty: true, labelId: labelId('state') },
              }}
            >
              <MenuItem value="">{t('mailSend.state.any')}</MenuItem>

              {Object.values(MailSubscriptionState).map(value => (
                <MenuItem
                  key={value}
                  value={value}
                >
                  {t(`mailSend.state.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          {triStateSelect(
            'auto-renew',
            t('mailSend.autoRenew'),
            state.autoRenew,
            autoRenew => ({ autoRenew }),
            { help: t('mailSend.autoRenewHelp') }
          )}

          <FormControl fullWidth>
            <FieldLabel
              id={labelId('payment-method')}
              label={t('mailSend.paymentMethod')}
            />
            <TextField
              select
              value={state.paymentMethodID ?? ''}
              onChange={event =>
                onChange({ paymentMethodID: event.target.value || null })
              }
              fullWidth
              slotProps={{
                select: {
                  displayEmpty: true,
                  labelId: labelId('payment-method'),
                },
              }}
            >
              <MenuItem value="">{t('mailSend.any')}</MenuItem>

              {(paymentMethodData?.paymentMethods ?? []).map(method => (
                <MenuItem
                  key={method.id}
                  value={method.id}
                >
                  {method.name}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          <FormControl fullWidth>
            <FieldLabel
              id={labelId('periodicity')}
              label={t('mailSend.periodicity')}
            />
            <TextField
              select
              value={state.periodicity ?? ''}
              onChange={event =>
                onChange({
                  periodicity:
                    (event.target.value as PaymentPeriodicity) || null,
                })
              }
              fullWidth
              slotProps={{
                select: { displayEmpty: true, labelId: labelId('periodicity') },
              }}
            >
              <MenuItem value="">{t('mailSend.any')}</MenuItem>

              {Object.values(PaymentPeriodicity).map(value => (
                <MenuItem
                  key={value}
                  value={value}
                >
                  {t(`memberPlanList.paymentPeriodicity.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          <FormControl fullWidth>
            <DateRangeFilter
              label={t('mailSend.startsAt')}
              value={{ from: state.startsAtFrom, to: state.startsAtTo }}
              onChange={({ from, to }) =>
                onChange({ startsAtFrom: from, startsAtTo: to })
              }
            />
          </FormControl>

          <FormControl fullWidth>
            <DateRangeFilter
              label={t('mailSend.endsAt')}
              value={{ from: state.endsAtFrom, to: state.endsAtTo }}
              onChange={({ from, to }) =>
                onChange({ endsAtFrom: from, endsAtTo: to })
              }
            />
            <FormHelperText>{t('mailSend.endsAtHint')}</FormHelperText>
          </FormControl>

          {triStateSelect(
            'is-paid',
            t('mailSend.isPaid'),
            state.isPaid,
            isPaid => ({ isPaid }),
            { hint: t('mailSend.isPaidHint') }
          )}
          {triStateSelect(
            'is-canceled',
            t('mailSend.isCanceled'),
            state.isCanceled,
            isCanceled => ({ isCanceled }),
            { hint: t('mailSend.isCanceledHint') }
          )}
          {triStateSelect(
            'has-replaced',
            t('mailSend.hasReplacedSubscription'),
            state.hasReplaced,
            hasReplaced => ({ hasReplaced }),
            { hint: t('mailSend.hasReplacedSubscriptionHint') }
          )}
        </>
      )}
    </Stack>
  );
}
