import {
  Autocomplete,
  AutocompleteRenderInputParams,
  TextField,
} from '@mui/material';
import { ReactNode } from 'react';

import { usePageOptions } from './usePageOptions';

interface SelectPageProps {
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  selectedPage?: string | null;
  setSelectedPage(page: string | null): void;
  label?: ReactNode;
  'aria-labelledby'?: string;
  renderInput?: (params: AutocompleteRenderInputParams) => ReactNode;
}

export function SelectPage({
  className,
  disabled,
  readOnly,
  id,
  name,
  selectedPage,
  setSelectedPage,
  label,
  'aria-labelledby': ariaLabelledby,
  renderInput,
}: SelectPageProps) {
  const { pageIds, labelFor, search } = usePageOptions();

  return (
    <Autocomplete
      id={id}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      options={pageIds}
      getOptionLabel={labelFor}
      filterOptions={options => options}
      onInputChange={(_event, title) => search(title)}
      value={selectedPage ?? null}
      onChange={(_event, value) => setSelectedPage(value)}
      renderInput={
        renderInput ??
        (params => (
          <TextField
            {...params}
            label={label}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                'aria-labelledby': ariaLabelledby,
              },
            }}
            name={name}
          />
        ))
      }
      fullWidth
    />
  );
}
