import styled from '@emotion/styled';
import {
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';

import { InfoTooltip } from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import {
  Controller,
  FieldPath,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
import { EngagementRuleValues } from './engagement-rule-values';

export const FieldRow = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;
`;

export const label = (text: string, info?: string): ReactNode =>
  info ?
    <>
      {text} <InfoTooltip text={info} />
    </>
  : text;

type NumberFieldProps = {
  name: FieldPath<EngagementRuleValues>;
  label: ReactNode;
  /** An empty field is null instead of 0. */
  nullable?: boolean;
  disabled?: boolean;
  min?: number;
  /** Shown while editing, before the form was submitted. */
  liveError?: string;
};

export const NumberField = ({
  name,
  label: fieldLabel,
  nullable,
  disabled,
  min = 0,
  liveError,
}: NumberFieldProps) => {
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          name={field.name}
          inputRef={field.ref}
          onBlur={field.onBlur}
          value={(field.value as number | null) ?? ''}
          onChange={({ target: { value } }) =>
            field.onChange(
              value === '' ?
                nullable ? null
                : 0
              : +value
            )
          }
          label={fieldLabel}
          type="number"
          slotProps={{ htmlInput: { min } }}
          disabled={disabled}
          error={Boolean(error ?? liveError)}
          helperText={error?.message ?? liveError}
          fullWidth
        />
      )}
    />
  );
};

type TextFieldControlProps = {
  name: FieldPath<EngagementRuleValues>;
  label: ReactNode;
  multiline?: boolean;
};

export const TextFieldControl = ({
  name,
  label: fieldLabel,
  multiline,
}: TextFieldControlProps) => {
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          name={field.name}
          inputRef={field.ref}
          onBlur={field.onBlur}
          value={(field.value as string | null) ?? ''}
          onChange={({ target: { value } }) => field.onChange(value || null)}
          label={fieldLabel}
          multiline={multiline}
          rows={multiline ? 4 : undefined}
          error={Boolean(error)}
          helperText={error?.message}
          fullWidth
        />
      )}
    />
  );
};

export const SwitchControl = ({
  name,
  label: fieldLabel,
}: {
  name: FieldPath<EngagementRuleValues>;
  label: ReactNode;
}) => {
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(field.value)}
              onChange={(_event, checked) => field.onChange(checked)}
            />
          }
          label={fieldLabel}
        />
      )}
    />
  );
};

/**
 * Rarely needed fields, out of the way until asked for. Open from the start
 * when one of them is in use, and again when saving failed on one.
 */
export const MoreOptions = ({
  inUse,
  hasErrors,
  children,
}: {
  inUse: boolean;
  hasErrors: boolean;
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  const { submitCount } = useFormState();
  const [open, setOpen] = useState(inUse);
  const [seenSubmitCount, setSeenSubmitCount] = useState(submitCount);

  if (submitCount !== seenSubmitCount) {
    setSeenSubmitCount(submitCount);

    if (hasErrors) {
      setOpen(true);
    }
  }

  return (
    <>
      <Box>
        <Button
          variant="text"
          size="small"
          aria-expanded={open}
          endIcon={open ? <MdExpandLess /> : <MdExpandMore />}
          onClick={() => setOpen(!open)}
        >
          {t('engagement.form.moreOptions')}
        </Button>
      </Box>

      {open && children}
    </>
  );
};
