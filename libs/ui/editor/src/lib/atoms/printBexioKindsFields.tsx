import {
  Button,
  FormHelperText,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';

/**
 * One of the medium's bexio kinds (setting `printBexioKinds`): what the lists
 * call it, the word that marks it in bexio, and what must follow the word.
 */
export type PrintBexioKindValue = {
  id: string;
  label: string;
  word: string;
  /** «period»: a year or a date range; «issue»: one issue, e.g. «6.26» */
  refersTo: 'period' | 'issue';
};

const isKind = (value: unknown): value is PrintBexioKindValue => {
  const kind = value as Partial<PrintBexioKindValue> | null;

  return (
    typeof kind === 'object' &&
    kind !== null &&
    typeof kind.id === 'string' &&
    typeof kind.label === 'string' &&
    typeof kind.word === 'string' &&
    (kind.refersTo === 'period' || kind.refersTo === 'issue')
  );
};

/** The kinds as stored; whatever is not a complete kind is left out. */
export const printBexioKindsOf = (raw: unknown): PrintBexioKindValue[] =>
  Array.isArray(raw) ? raw.filter(isKind) : [];

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `kind-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * The bexio kinds of the medium: each row a kind with its label, its word and
 * whether a period or an issue follows. Deleting a kind leaves stored lists
 * as they are; options naming it ignore it.
 */
export function PrintBexioKindsFields({
  value,
  onChange,
  disabled = false,
}: {
  value: PrintBexioKindValue[];
  onChange: (value: PrintBexioKindValue[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const change = (index: number, patch: Partial<PrintBexioKindValue>) =>
    onChange(
      value.map((kind, at) => (at === index ? { ...kind, ...patch } : kind))
    );

  return (
    <Stack spacing={1.5}>
      {value.length === 0 && (
        <FormHelperText sx={{ m: 0 }}>
          {t('printBexioKinds.empty')}
        </FormHelperText>
      )}

      {value.map((kind, index) => (
        <Stack
          key={kind.id}
          role="group"
          aria-label={t('printBexioKinds.kind', {
            label: kind.label || index + 1,
          })}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <TextField
            size="small"
            label={t('printBexioKinds.label')}
            value={kind.label}
            disabled={disabled}
            onChange={event => change(index, { label: event.target.value })}
          />
          <TextField
            size="small"
            label={t('printBexioKinds.word')}
            value={kind.word}
            disabled={disabled}
            onChange={event => change(index, { word: event.target.value })}
          />
          <TextField
            size="small"
            select
            label={t('printBexioKinds.refersTo')}
            value={kind.refersTo}
            disabled={disabled}
            onChange={event =>
              change(index, {
                refersTo: event.target.value as PrintBexioKindValue['refersTo'],
              })
            }
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="period">
              {t('printBexioKinds.refersToPeriod')}
            </MenuItem>
            <MenuItem value="issue">
              {t('printBexioKinds.refersToIssue')}
            </MenuItem>
          </TextField>
          <IconButton
            aria-label={t('printBexioKinds.delete', {
              label: kind.label || index + 1,
            })}
            size="small"
            color="error"
            disabled={disabled}
            onClick={() => onChange(value.filter((_kind, at) => at !== index))}
          >
            <MdDelete />
          </IconButton>
        </Stack>
      ))}

      <Button
        variant="text"
        startIcon={<MdAdd />}
        disabled={disabled}
        onClick={() =>
          onChange([
            ...value,
            { id: newId(), label: '', word: '', refersTo: 'period' },
          ])
        }
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('printBexioKinds.add')}
      </Button>
    </Stack>
  );
}
