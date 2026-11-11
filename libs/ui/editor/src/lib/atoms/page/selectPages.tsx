import {
  Autocomplete,
  AutocompleteRenderInputParams,
  TextField,
} from '@mui/material';
import { ReactNode } from 'react';

import { usePageOptions } from './usePageOptions';

interface SelectPagesProps {
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  selectedPages?: string[] | null;
  setSelectedPages(pages: string[]): void;
  renderInput?: (params: AutocompleteRenderInputParams) => ReactNode;
}

export function SelectPages({
  className,
  disabled,
  readOnly,
  id,
  name,
  placeholder,
  selectedPages,
  setSelectedPages,
  renderInput,
}: SelectPagesProps) {
  const { pageIds, labelFor, search } = usePageOptions();

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      id={id}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      options={[
        ...pageIds,
        ...(selectedPages ?? []).filter(page => !pageIds.includes(page)),
      ]}
      getOptionLabel={labelFor}
      filterOptions={options => options}
      onInputChange={(_event, title) => search(title)}
      value={selectedPages ?? []}
      onChange={(_event, pages) => setSelectedPages(pages)}
      renderInput={
        renderInput ??
        (params => (
          <TextField
            {...params}
            name={name}
            placeholder={placeholder}
          />
        ))
      }
      fullWidth
    />
  );
}
