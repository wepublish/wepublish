import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { DatePicker, Input, InputGroup, SelectPicker } from 'rsuite';

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
    <FilterBar>
      <InputGroup inside>
        <InputGroup.Addon>
          <MdSearch />
        </InputGroup.Addon>

        <Input
          type="search"
          placeholder={t('networkContentPage.searchLabel')}
          aria-label={t('networkContentPage.searchLabel')}
          value={filters.search}
          onChange={search => updateFilter({ search })}
        />
      </InputGroup>

      <SelectPicker
        block
        data={clients.map(client => ({
          label: client.name,
          value: client.name,
        }))}
        placeholder={t('networkContentPage.allMedia')}
        aria-label={t('networkContentPage.mediaFilter')}
        value={filters.clientName || null}
        onChange={clientName => updateFilter({ clientName: clientName ?? '' })}
      />

      <DatePicker
        block
        oneTap
        format="dd.MM.yyyy"
        placeholder={t('networkContentPage.dateFrom')}
        aria-label={t('networkContentPage.dateFrom')}
        value={toDate(filters.dateFrom)}
        onChange={date => updateFilter({ dateFrom: toIso(date) })}
      />

      <DatePicker
        block
        oneTap
        format="dd.MM.yyyy"
        placeholder={t('networkContentPage.dateTo')}
        aria-label={t('networkContentPage.dateTo')}
        value={toDate(filters.dateTo)}
        onChange={date => updateFilter({ dateTo: toIso(date) })}
      />
    </FilterBar>
  );
}
