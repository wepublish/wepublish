import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MdClear } from 'react-icons/md';

import { FilterBar } from './networkContent.styles';
import type { ArticleFilterParams, WepOneClient } from './networkContent.types';

interface NetworkContentArticleFiltersProps {
  filters: ArticleFilterParams;
  clients: WepOneClient[];
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
    if (!d || isNaN(d.getTime())) return '';
    return format(d, 'yyyy-MM-dd');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          label={t('networkContentPage.dateFrom')}
          value={toDate(filters.dateFrom)}
          onChange={d => updateFilter({ dateFrom: toIso(d) })}
          slotProps={{
            textField: { size: 'small' },
            field: {
              clearable: true,
              onClear: () => updateFilter({ dateFrom: '' }),
            },
          }}
        />

        <DatePicker
          format="dd.MM.yyyy"
          label={t('networkContentPage.dateTo')}
          value={toDate(filters.dateTo)}
          onChange={d => updateFilter({ dateTo: toIso(d) })}
          slotProps={{
            textField: { size: 'small' },
            field: {
              clearable: true,
              onClear: () => updateFilter({ dateTo: '' }),
            },
          }}
        />
      </FilterBar>
    </LocalizationProvider>
  );
}
