import {
  Autocomplete,
  ListItemText,
  SxProps,
  TextField,
  Theme,
} from '@mui/material';
import { useState } from 'react';

export type NamedId = {
  id: string;
  name: string;
  /** Shown under the option in the dropdown only. */
  description?: string;
};

export const namedIdLabel = (options: NamedId[], id: string) => {
  const option = options.find(o => o.id === id);

  return option ? `${option.name} (${option.id})` : id;
};

type NamedIdAutocompleteProps = {
  value: string;
  onChange: (id: string) => void;
  options: NamedId[];
  loading?: boolean;
  label?: string;
  /** ID of an element outside the field that names it, for a field without `label`. */
  labelledBy?: string;
  placeholder?: string;
  helperText?: string;
  sx?: SxProps<Theme>;
};

/**
 * Free-text ID field that shows a known ID as "Name (ID)".
 *
 * A freeSolo MUI Autocomplete only recomputes its text when `value` changes,
 * so a saved ID stays bare when the names load after mount. The text is
 * therefore controlled here: it follows the value unless the user is typing.
 */
export function NamedIdAutocomplete({
  value,
  onChange,
  options,
  loading,
  label,
  labelledBy,
  placeholder,
  helperText,
  sx,
}: NamedIdAutocompleteProps) {
  // what the user is typing; null while the field shows the value's label
  const [draft, setDraft] = useState<string | null>(null);
  const labelFor = (id: string) => namedIdLabel(options, id);

  return (
    <Autocomplete
      freeSolo
      selectOnFocus
      options={options.map(o => o.id)}
      getOptionLabel={labelFor}
      filterOptions={(ids, { inputValue }) =>
        ids.filter(id =>
          labelFor(id).toLowerCase().includes(inputValue.toLowerCase())
        )
      }
      renderOption={({ key, ...props }, id) => {
        const description = options.find(o => o.id === id)?.description;

        return (
          <li
            key={key}
            {...props}
          >
            {description ?
              <ListItemText
                primary={labelFor(id)}
                secondary={description}
              />
            : labelFor(id)}
          </li>
        );
      }}
      value={value}
      inputValue={draft ?? labelFor(value)}
      onInputChange={(_, inputValue, reason) => {
        if (reason === 'input') {
          setDraft(inputValue);
          onChange(inputValue);
        }
      }}
      onChange={(_, newValue) => {
        setDraft(null);
        onChange(newValue ?? '');
      }}
      onBlur={() => setDraft(null)}
      loading={loading}
      sx={sx}
      renderInput={params => (
        <TextField
          {...params}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-labelledby': labelledBy,
            },
          }}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
        />
      )}
    />
  );
}
