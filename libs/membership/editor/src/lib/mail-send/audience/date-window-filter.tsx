import {
  Chip,
  FormLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { MailRollingKind } from '@wepublish/editor/api';
import { DateRange, DateRangeFilter } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

/** A range relative to the day the audience is resolved. */
export type RollingValue = { kind: MailRollingKind; days: number };

/** What a rolling range starts with when it is switched on. */
export const DEFAULT_ROLLING_DAYS = 30;

const QUICK_PICKS = [7, 30, 90];

export type DateWindowFilterProps = {
  label: string;
  range: DateRange;
  /** Null while fixed dates apply. */
  rolling: RollingValue | null;
  /** The rolling kinds that make sense here; the first is the default. */
  kinds: MailRollingKind[];
  onRangeChange: (range: DateRange) => void;
  onRollingChange: (rolling: RollingValue | null) => void;
  disableFuture?: boolean;
};

/**
 * A date range that is either picked from the calendar or said relative to
 * today ("in the last 30 days"). The toggle sits next to the input and
 * swaps it; the fixed dates are kept while rolling is on, so switching back
 * loses nothing.
 */
export function DateWindowFilter({
  label,
  range,
  rolling,
  kinds,
  onRangeChange,
  onRollingChange,
  disableFuture,
}: DateWindowFilterProps) {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label={t('mailSend.dateWindow.mode', { label })}
        value={rolling ? 'rolling' : 'fixed'}
        onChange={(_event, mode: 'fixed' | 'rolling' | null) => {
          if (mode === 'rolling' && !rolling) {
            onRollingChange({ kind: kinds[0], days: DEFAULT_ROLLING_DAYS });
          }

          if (mode === 'fixed' && rolling) {
            onRollingChange(null);
          }
        }}
        // As tall as the small inputs it sits next to.
        sx={{ height: 40 }}
      >
        <ToggleButton value="fixed">
          {t('mailSend.dateWindow.fixed')}
        </ToggleButton>
        <ToggleButton value="rolling">
          {t('mailSend.dateWindow.rolling')}
        </ToggleButton>
      </ToggleButtonGroup>

      {rolling ?
        <Stack
          spacing={0.5}
          sx={{ flex: 1, minWidth: 260 }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            {kinds.length > 1 ?
              <TextField
                select
                size="small"
                label={label}
                value={rolling.kind}
                onChange={event =>
                  onRollingChange({
                    ...rolling,
                    kind: event.target.value as MailRollingKind,
                  })
                }
                style={{ flex: 1, minWidth: 150 }}
              >
                {kinds.map(kind => (
                  <MenuItem
                    key={kind}
                    value={kind}
                  >
                    {t(`mailSend.dateWindow.kinds.${kind}`)}
                  </MenuItem>
                ))}
              </TextField>
            : <Stack sx={{ flex: 1 }}>
                <FormLabel>{label}</FormLabel>
                <Typography variant="body2">
                  {t(`mailSend.dateWindow.kinds.${rolling.kind}`)}
                </Typography>
              </Stack>
            }

            <TextField
              type="number"
              size="small"
              value={rolling.days}
              onChange={event => {
                const days = parseInt(event.target.value, 10);

                if (Number.isFinite(days) && days > 0) {
                  onRollingChange({ ...rolling, days });
                }
              }}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 3650,
                  'aria-label': t('mailSend.dateWindow.days'),
                },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {t(`mailSend.dateWindow.unit.${rolling.kind}`)}
                    </InputAdornment>
                  ),
                },
              }}
              style={{ width: 170 }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
          >
            {QUICK_PICKS.map(days => (
              <Chip
                key={days}
                size="small"
                variant={rolling.days === days ? 'filled' : 'outlined'}
                label={t('mailSend.dateWindow.quick', { days })}
                onClick={() => onRollingChange({ ...rolling, days })}
              />
            ))}
          </Stack>
        </Stack>
      : <div style={{ flex: 1, minWidth: 260 }}>
          <DateRangeFilter
            label={label}
            disableFuture={disableFuture}
            value={range}
            onChange={onRangeChange}
          />
        </div>
      }
    </Stack>
  );
}
