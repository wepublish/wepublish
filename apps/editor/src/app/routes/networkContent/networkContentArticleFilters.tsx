import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdClear } from 'react-icons/md';

import type {
  ArticleFilterParams,
  DirectusClient,
} from './networkContent.types';
import { FilterBar } from './networkContent.styles';

interface NetworkContentArticleFiltersProps {
  filters: ArticleFilterParams;
  clients: DirectusClient[];
  onFiltersChange: (filters: ArticleFilterParams) => void;
}

export function NetworkContentArticleFilters({
  filters,
  clients,
  onFiltersChange,
}: NetworkContentArticleFiltersProps) {
  const { t } = useTranslation();

  const updateFilter = (patch: Partial<ArticleFilterParams>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const hasActiveFilters =
    filters.search || filters.clientName || filters.dateFrom || filters.dateTo;

  return (
    <FilterBar>
      <TextField
        size="small"
        label={t('networkContentPage.searchLabel')}
        value={filters.search}
        onChange={e => updateFilter({ search: e.target.value })}
        InputProps={{
          endAdornment:
            hasActiveFilters ?
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() =>
                    onFiltersChange({
                      search: '',
                      clientName: '',
                      dateFrom: '',
                      dateTo: '',
                    })
                  }
                >
                  <MdClear />
                </IconButton>
              </InputAdornment>
            : undefined,
        }}
      />

      <FormControl size="small">
        <InputLabel>{t('networkContentPage.mediaFilter')}</InputLabel>
        <Select
          value={filters.clientName}
          label={t('networkContentPage.mediaFilter')}
          onChange={e => updateFilter({ clientName: e.target.value })}
        >
          <MenuItem value="">{t('networkContentPage.allMedia')}</MenuItem>
          {clients.map(client => (
            <MenuItem
              key={client.name}
              value={client.name}
            >
              {client.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        type="date"
        label={t('networkContentPage.dateFrom')}
        value={filters.dateFrom}
        onChange={e => updateFilter({ dateFrom: e.target.value })}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        size="small"
        type="date"
        label={t('networkContentPage.dateTo')}
        value={filters.dateTo}
        onChange={e => updateFilter({ dateTo: e.target.value })}
        InputLabelProps={{ shrink: true }}
      />
    </FilterBar>
  );
}
