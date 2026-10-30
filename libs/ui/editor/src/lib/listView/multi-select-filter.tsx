import styled from '@emotion/styled';
import {
  Autocomplete,
  autocompleteClasses,
  Checkbox,
  Chip,
  SxProps,
  TextField,
  Theme,
} from '@mui/material';
import { useMemo } from 'react';

import { InfoTooltip } from '../atoms/infoTooltip';

export type MultiSelectFilterOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
  chipSx?: SxProps<Theme>;
};

export interface MultiSelectFilterProps<T extends string = string> {
  options: MultiSelectFilterOption<T>[];
  value: T[];
  onChange(value: T[]): void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

const StyledAutocomplete = styled(Autocomplete)`
  min-width: 200px;

  .${autocompleteClasses.inputRoot} {
    padding: 2px 56px 2px 6px;
  }
` as typeof Autocomplete;

const HintSpacer = styled.span`
  margin-left: 4px;
  display: inline-flex;
`;

export function MultiSelectFilter<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder,
  className,
  disabled,
  'data-testid': dataTestId,
}: MultiSelectFilterProps<T>) {
  const selected = useMemo(
    () => options.filter(option => value.includes(option.value)),
    [options, value]
  );

  return (
    <StyledAutocomplete
      multiple
      disableCloseOnSelect
      className={className}
      disabled={disabled}
      data-testid={dataTestId}
      options={options}
      value={selected}
      isOptionEqualToValue={(option, selectedOption) =>
        option.value === selectedOption.value
      }
      getOptionLabel={option => option.label}
      onChange={(_event, picked) =>
        onChange(
          options
            .filter(option => picked.some(p => p.value === option.value))
            .map(option => option.value)
        )
      }
      renderOption={({ key, ...props }, option, { selected: isSelected }) => (
        <li
          key={key}
          {...props}
        >
          <Checkbox
            size="small"
            checked={isSelected}
          />

          {option.label}

          {option.hint && (
            <HintSpacer>
              <InfoTooltip text={option.hint} />
            </HintSpacer>
          )}
        </li>
      )}
      renderValue={(picked, getItemProps) =>
        picked.map((option, index) => (
          <Chip
            size="small"
            label={option.label}
            sx={option.chipSx}
            {...getItemProps({ index })}
            key={option.value}
          />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={selected.length ? undefined : placeholder}
        />
      )}
    />
  );
}
