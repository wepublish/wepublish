import { FormControlLabel, FormHelperText, Stack, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { InfoTooltip } from './infoTooltip';
import { SelectMemberPlans } from './memberPlan/selectMemberPlans';

/** What a print list is computed from: the issue's options, or the medium's defaults. */
export type PrintExportOptionsValue = {
  /** only these member plans; null = every subscription plan */
  memberPlanIds: string[] | null;
  includeBexio: boolean;
  includeOpen: boolean;
  includeUpcoming: boolean;
};

export const DEFAULT_PRINT_EXPORT_OPTIONS: PrintExportOptionsValue = {
  memberPlanIds: null,
  includeBexio: true,
  includeOpen: true,
  includeUpcoming: false,
};

const FLAGS = ['includeBexio', 'includeOpen', 'includeUpcoming'] as const;

type Translate = (key: string, values?: Record<string, unknown>) => string;

/** Options as stored, with whatever an older value lacks filled from the defaults. */
export const printExportOptionsOf = (
  raw: unknown
): PrintExportOptionsValue => ({
  ...DEFAULT_PRINT_EXPORT_OPTIONS,
  ...(typeof raw === 'object' && raw !== null ? raw : {}),
});

export const samePrintExportOptions = (
  a: PrintExportOptionsValue,
  b: PrintExportOptionsValue
): boolean =>
  FLAGS.every(key => a[key] === b[key]) &&
  [...(a.memberPlanIds ?? [])].sort().join('\n') ===
    [...(b.memberPlanIds ?? [])].sort().join('\n');

/** «alle Pläne · bexio · offen · Vorab» */
export function describePrintExportOptions(
  value: PrintExportOptionsValue,
  t: Translate
): string {
  return [
    value.memberPlanIds?.length ?
      t('printExportOptions.plansCount', { count: value.memberPlanIds.length })
    : t('printExportOptions.allPlans'),
    value.includeBexio && t('printExportOptions.bexioShort'),
    value.includeOpen && t('printExportOptions.openShort'),
    value.includeUpcoming && t('printExportOptions.upcomingShort'),
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * The options of a print list: member plans, bexio, «offen» readers,
 * Vorab-Exemplare. Shared by the issue's Druckliste and the medium's defaults
 * in the settings. Every change hands the whole value back.
 */
export function PrintExportOptionsFields({
  value,
  onChange,
  disabled = false,
  bexioConfigured = true,
}: {
  value: PrintExportOptionsValue;
  onChange: (value: PrintExportOptionsValue) => void;
  disabled?: boolean;
  /** a bexio payment provider with an API key exists; without it the switch has no effect */
  bexioConfigured?: boolean;
}) {
  const { t } = useTranslation();
  const set = (patch: Partial<PrintExportOptionsValue>) =>
    onChange({ ...value, ...patch });

  const flag = (key: (typeof FLAGS)[number], locked = false, hint?: string) => (
    <Stack
      key={key}
      direction="row"
      spacing={0.5}
      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
    >
      <FormControlLabel
        sx={{ mr: 0 }}
        control={
          <Switch
            checked={value[key]}
            disabled={disabled || locked}
            onChange={(_event, checked) => set({ [key]: checked })}
          />
        }
        label={t(`printExportOptions.${key}`)}
      />
      <InfoTooltip text={t(`printExportOptions.${key}Help`)} />
      {hint && (
        <FormHelperText sx={{ width: '100%', m: 0 }}>{hint}</FormHelperText>
      )}
    </Stack>
  );

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        <SelectMemberPlans
          disabled={disabled}
          defaultMemberPlans={[]}
          selectedMemberPlans={value.memberPlanIds ?? []}
          setSelectedMemberPlans={ids =>
            set({ memberPlanIds: ids.length ? ids : null })
          }
          label={t('printExportOptions.memberPlans')}
        />
        <FormHelperText sx={{ m: 0 }}>
          {t('printExportOptions.memberPlansHelp')}
        </FormHelperText>
      </Stack>
      {flag(
        'includeBexio',
        !bexioConfigured,
        bexioConfigured ? undefined : t('printExportOptions.bexioNotConfigured')
      )}
      {flag('includeOpen')}
      {flag('includeUpcoming')}
    </Stack>
  );
}
