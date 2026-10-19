import { useQuery } from '@apollo/client/react';
import {
  MailChannel,
  MailHistoryMatch,
  MailLogState,
  MailTemplateDocument,
} from '@wepublish/editor/api';
import { DateRangeFilter } from '@wepublish/ui/editor';
import {
  Autocomplete,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useLetterChannel } from '../../mail-template/use-letter-channel';
import {
  AudienceFilterState,
  emptyMailHistoryRow,
  MailHistoryRow,
} from './audience-state';

type MailHistoryValue = AudienceFilterState['mailHistory'];

export type MailHistoryFilterProps = {
  value: MailHistoryValue;
  onChange: (value: MailHistoryValue) => void;
};

/**
 * "Was (not) sent template X, in this state, on this channel, between these
 * dates" — one row per condition, combined by all or any. Reads like a
 * sentence from left to right, so a filter can be checked at a glance.
 */
export function MailHistoryFilter({ value, onChange }: MailHistoryFilterProps) {
  const { t } = useTranslation();
  const { letterAvailable } = useLetterChannel();
  const { data } = useQuery(MailTemplateDocument);
  const templates = data?.mailTemplates ?? [];

  const setRows = (rows: MailHistoryRow[]) => onChange({ ...value, rows });
  const patchRow = (id: string, patch: Partial<MailHistoryRow>) =>
    setRows(
      value.rows.map(row => (row.id === id ? { ...row, ...patch } : row))
    );

  return (
    <FormControl fullWidth>
      <FormLabel>{t('mailSend.mailHistory.label')}</FormLabel>
      <FormHelperText style={{ marginLeft: 0 }}>
        {t('mailSend.mailHistory.hint')}
      </FormHelperText>

      {value.rows.length > 1 && (
        <RadioGroup
          row
          value={value.match}
          onChange={(_event, match) =>
            onChange({ ...value, match: match as MailHistoryMatch })
          }
          style={{ marginTop: 8 }}
        >
          <FormControlLabel
            value={MailHistoryMatch.All}
            control={<Radio size="small" />}
            label={t('mailSend.mailHistory.match.all')}
          />
          <FormControlLabel
            value={MailHistoryMatch.Any}
            control={<Radio size="small" />}
            label={t('mailSend.mailHistory.match.any')}
          />
        </RadioGroup>
      )}

      <Stack
        spacing={1.5}
        style={{ marginTop: 8 }}
      >
        {value.rows.map(row => (
          <Stack
            key={row.id}
            spacing={1}
            sx={{
              padding: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <TextField
                select
                size="small"
                value={row.negate ? 'notReceived' : 'received'}
                onChange={event =>
                  patchRow(row.id, {
                    negate: event.target.value === 'notReceived',
                  })
                }
                style={{ minWidth: 170 }}
              >
                <MenuItem value="received">
                  {t('mailSend.mailHistory.received')}
                </MenuItem>
                <MenuItem value="notReceived">
                  {t('mailSend.mailHistory.notReceived')}
                </MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                value={row.mailTemplateId ?? ''}
                onChange={event =>
                  patchRow(row.id, {
                    mailTemplateId: event.target.value || null,
                  })
                }
                slotProps={{ select: { displayEmpty: true } }}
                style={{ flex: 1, minWidth: 200 }}
              >
                <MenuItem value="">
                  {t('mailSend.mailHistory.template')}
                </MenuItem>
                {templates.map(template => (
                  <MenuItem
                    key={template.id}
                    value={template.id}
                  >
                    {template.name}
                  </MenuItem>
                ))}
              </TextField>

              <Tooltip title={t('mailSend.mailHistory.remove')}>
                <IconButton
                  size="small"
                  aria-label={t('mailSend.mailHistory.remove')}
                  onClick={() =>
                    setRows(value.rows.filter(other => other.id !== row.id))
                  }
                >
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <Autocomplete
                multiple
                size="small"
                disableCloseOnSelect
                options={Object.values(MailLogState)}
                getOptionLabel={state =>
                  t(`mailSend.mailHistory.states.${state}`)
                }
                value={row.states}
                onChange={(_event, states) =>
                  patchRow(row.id, { states: states as MailLogState[] })
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('mailSend.mailHistory.state')}
                    placeholder={t('mailSend.mailHistory.anyState')}
                  />
                )}
                style={{ flex: 1, minWidth: 220 }}
              />

              {letterAvailable && (
                <TextField
                  select
                  size="small"
                  label={t('mailSend.mailHistory.channel')}
                  value={row.channel ?? ''}
                  onChange={event =>
                    patchRow(row.id, {
                      channel: (event.target.value as MailChannel) || null,
                    })
                  }
                  // «Beliebig» is shown for the empty value, so the label must
                  // sit above it from the start, not float over it.
                  slotProps={{
                    select: { displayEmpty: true },
                    inputLabel: { shrink: true },
                  }}
                  style={{ minWidth: 150 }}
                >
                  <MenuItem value="">
                    {t('mailSend.mailHistory.anyChannel')}
                  </MenuItem>
                  <MenuItem value={MailChannel.Mail}>
                    {t('mailSend.channel.mail')}
                  </MenuItem>
                  <MenuItem value={MailChannel.Letter}>
                    {t('mailSend.channel.letter')}
                  </MenuItem>
                </TextField>
              )}
            </Stack>

            <DateRangeFilter
              label={t('mailSend.mailHistory.sentBetween')}
              disableFuture
              value={{ from: row.from, to: row.to }}
              onChange={({ from, to }) => patchRow(row.id, { from, to })}
            />
          </Stack>
        ))}

        <div>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdAdd />}
            onClick={() => setRows([...value.rows, emptyMailHistoryRow()])}
          >
            {t('mailSend.mailHistory.add')}
          </Button>
        </div>
      </Stack>
    </FormControl>
  );
}
