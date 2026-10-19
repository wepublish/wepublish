import { useQuery } from '@apollo/client/react';
import {
  MailEmailSegment,
  MailRecipientBase,
  MailSubscriptionState,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { DateRangeFilter, InfoTooltip } from '@wepublish/ui/editor';
import {
  Autocomplete,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AudienceFilterState, EndedMode, TriState } from './audience-state';
import { MailHistoryFilter } from './mail-history-filter';

export type AudienceFilterProps = {
  state: AudienceFilterState;
  onChange: (patch: Partial<AudienceFilterState>) => void;
  /** Shown under the base choice, e.g. a warning about the chosen template. */
  children?: ReactNode;
  /** The label over the base choice; null when the surroundings name it already. */
  baseLabel?: ReactNode | null;
};

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
}: AudienceFilterProps) {
  const { t } = useTranslation();
  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);

  const isSubscriptionBase = state.base === MailRecipientBase.HasSubscription;
  const isWinBackBase = state.base === MailRecipientBase.EndedSubscription;
  const memberPlans = memberPlanData?.memberPlans.nodes ?? [];

  const triStateSelect = (
    label: ReactNode,
    value: TriState,
    patch: (value: TriState) => Partial<AudienceFilterState>,
    hint?: string
  ) => (
    <FormControl fullWidth>
      <FormLabel>{label}</FormLabel>
      <TextField
        select
        value={value}
        onChange={event =>
          onChange(patch((event.target.value as TriState) ?? 'any'))
        }
        fullWidth
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
      <FormLabel>{t('mailSend.memberPlans')}</FormLabel>
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
          <FormLabel>{baseLabel ?? t('mailSend.base.label')}</FormLabel>
        )}
        <RadioGroup
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
        <FormLabel>{t('mailSend.emailSegments.label')}</FormLabel>
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={Object.values(MailEmailSegment)}
          getOptionLabel={segment => t(`mailSend.emailSegments.${segment}`)}
          value={state.emailSegments}
          onChange={(_event, value) =>
            onChange({ emailSegments: value as MailEmailSegment[] })
          }
          renderInput={params => (
            <TextField
              {...params}
              placeholder={t('mailSend.emailSegments.pick')}
            />
          )}
        />
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
            <FormLabel>{t('mailSend.endedWindow.label')}</FormLabel>
            <RadioGroup
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
                    htmlInput: { min: 1, max: 3650 },
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
            <FormLabel>
              {t('mailSend.state.label')}{' '}
              <InfoTooltip text={t('mailSend.stateHelp')} />
            </FormLabel>
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
              slotProps={{ select: { displayEmpty: true } }}
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
            <>
              {t('mailSend.autoRenew')}{' '}
              <InfoTooltip text={t('mailSend.autoRenewHelp')} />
            </>,
            state.autoRenew,
            autoRenew => ({ autoRenew })
          )}

          <FormControl fullWidth>
            <FormLabel>{t('mailSend.paymentMethod')}</FormLabel>
            <TextField
              select
              value={state.paymentMethodID ?? ''}
              onChange={event =>
                onChange({ paymentMethodID: event.target.value || null })
              }
              fullWidth
              slotProps={{ select: { displayEmpty: true } }}
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
            <FormLabel>{t('mailSend.periodicity')}</FormLabel>
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
              slotProps={{ select: { displayEmpty: true } }}
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
            t('mailSend.isPaid'),
            state.isPaid,
            isPaid => ({ isPaid }),
            t('mailSend.isPaidHint')
          )}
          {triStateSelect(
            t('mailSend.isCanceled'),
            state.isCanceled,
            isCanceled => ({ isCanceled }),
            t('mailSend.isCanceledHint')
          )}
          {triStateSelect(
            t('mailSend.hasReplacedSubscription'),
            state.hasReplaced,
            hasReplaced => ({ hasReplaced }),
            t('mailSend.hasReplacedSubscriptionHint')
          )}
        </>
      )}
    </Stack>
  );
}
