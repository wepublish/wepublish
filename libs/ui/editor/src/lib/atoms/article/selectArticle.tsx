import {
  Autocomplete,
  AutocompleteRenderInputParams,
  TextField,
} from '@mui/material';
import { ReactNode } from 'react';

import { useArticleOptions } from './useArticleOptions';

interface SelectArticleProps {
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  selectedArticle?: string | null;
  setSelectedArticle(article: string | null): void;
  renderInput?: (params: AutocompleteRenderInputParams) => ReactNode;
}

export function SelectArticle({
  className,
  disabled,
  readOnly,
  id,
  name,
  selectedArticle,
  setSelectedArticle,
  renderInput,
}: SelectArticleProps) {
  const { articleIds, labelFor, search } = useArticleOptions(selectedArticle);

  return (
    <Autocomplete
      id={id}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      options={articleIds}
      getOptionLabel={labelFor}
      filterOptions={options => options}
      onInputChange={(_event, title) => search(title)}
      value={selectedArticle ?? null}
      onChange={(_event, value) => setSelectedArticle(value)}
      renderInput={
        renderInput ??
        (params => (
          <TextField
            {...params}
            name={name}
          />
        ))
      }
      fullWidth
    />
  );
}
