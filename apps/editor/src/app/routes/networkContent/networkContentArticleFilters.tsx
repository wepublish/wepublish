import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MdClear } from 'react-icons/md';
import { DatePicker } from 'rsuite';

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

  const toDate = (iso: string): Date | null => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const toIso = (d: Date | null): string => {
    if (!d) return '';
    return format(d, 'yyyy-MM-dd');
  };

  return (
    <FilterBar>
      <TextField
        size="small"
        label={t('networkContentPage.searchLabel')}
        value={filters.search}
        onChange={e => updateFilter({ search: e.target.value })}
        InputProps={{
          endAdornment:
            filters.search ?
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => updateFilter({ search: '' })}
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
          endAdornment={
            filters.clientName ?
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  sx={{ mr: 1 }}
                  onClick={() => updateFilter({ clientName: '' })}
                >
                  <MdClear />
                </IconButton>
              </InputAdornment>
            : undefined
          }
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

      <DatePicker
        format="dd.MM.yyyy"
        placeholder={t('networkContentPage.dateFrom')}
        value={toDate(filters.dateFrom)}
        onChange={d => updateFilter({ dateFrom: toIso(d) })}
        onClean={() => updateFilter({ dateFrom: '' })}
        cleanable
        size="sm"
        style={{ width: '100%' }}
      />

      <DatePicker
        format="dd.MM.yyyy"
        placeholder={t('networkContentPage.dateTo')}
        value={toDate(filters.dateTo)}
        onChange={d => updateFilter({ dateTo: toIso(d) })}
        onClean={() => updateFilter({ dateTo: '' })}
        cleanable
        size="sm"
        style={{ width: '100%' }}
      />
    </FilterBar>
  );
}
