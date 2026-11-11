import { Autocomplete, InputAdornment, TextField } from '@mui/material';
import { format } from 'date-fns';
import { DatePicker } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';

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
    if (!iso) {
      return null;
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const toIso = (d: Date | null): string => {
    if (!d || isNaN(d.getTime())) {
      return '';
    }
    return format(d, 'yyyy-MM-dd');
  };

  return (
    <FilterBar>
      <TextField
        type="search"
        label={t('networkContentPage.searchLabel')}
        value={filters.search}
        onChange={event => updateFilter({ search: event.target.value })}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            ),
          },
        }}
      />

      <Autocomplete
        options={clients.map(client => client.name)}
        value={filters.clientName || null}
        onChange={(_event, clientName) =>
          updateFilter({ clientName: clientName ?? '' })
        }
        renderInput={params => (
          <TextField
            {...params}
            label={t('networkContentPage.mediaFilter')}
            placeholder={t('networkContentPage.allMedia')}
          />
        )}
      />

      <DatePicker
        label={t('networkContentPage.dateFrom')}
        value={toDate(filters.dateFrom)}
        onChange={date => updateFilter({ dateFrom: toIso(date) })}
        size="small"
      />

      <DatePicker
        label={t('networkContentPage.dateTo')}
        value={toDate(filters.dateTo)}
        onChange={date => updateFilter({ dateTo: toIso(date) })}
        size="small"
      />
    </FilterBar>
  );
}
