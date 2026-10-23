import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material';
import {
  EventStatus,
  TagType,
  TinyPlaceListDocument,
} from '@wepublish/editor/api';
import {
  DateRangeFilter,
  MultiSelectFilter,
  OrganizationSelectPicker,
  SelectTags,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  EventEnding,
  EventListFilterState,
  EventPublicationState,
  NamedOption,
} from './event-list-filter';

const Form = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  gap: 12px;

  > * {
    min-width: 200px;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchField = styled(TextField)`
  width: 320px;

  @media (max-width: 640px) {
    width: auto;
  }
`;

const STATUSES = [
  EventStatus.Confirmed,
  EventStatus.Cancelled,
  EventStatus.Postponed,
  EventStatus.SoldOut,
];

const PUBLICATION_STATES: EventPublicationState[] = [
  'draft',
  'pending',
  'published',
];

const PUBLICATION_MARKS: Record<EventPublicationState, string> = {
  draft: '○',
  pending: '◔',
  published: '●',
};

const toDay = (date: Date | null) =>
  date ?
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  : null;

const fromDay = (day?: string | null) => {
  if (!day) {
    return null;
  }

  const [year, month, date] = day.split('-').map(Number);

  return new Date(year, month - 1, date);
};

interface VenueFilterProps {
  value: NamedOption | null;
  onChange(value: NamedOption | null): void;
}

function VenueFilter({ value, onChange }: VenueFilterProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data } = useQuery(TinyPlaceListDocument, {
    variables: { filter: search ? { search } : {}, take: 10 },
  });

  const options = useMemo(() => {
    const nodes: NamedOption[] = (data?.places.nodes ?? []).map(
      ({ id, name }) => ({ id, name })
    );

    return value && !nodes.some(({ id }) => id === value.id) ?
        [...nodes, value]
      : nodes;
  }, [data, value]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={options => options}
      value={value}
      onChange={(_event, place) => onChange(place)}
      onInputChange={(_event, input, reason) =>
        setSearch(reason === 'input' ? input : '')
      }
      renderInput={params => (
        <TextField
          {...params}
          label={t('agenda.list.filter.place')}
        />
      )}
    />
  );
}

export interface EventListFiltersProps {
  filter: EventListFilterState;
  canSeeAll?: boolean;
  onChange(filter: EventListFilterState): void;
}

export function EventListFilters({
  filter,
  canSeeAll,
  onChange,
}: EventListFiltersProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<EventListFilterState>) =>
    onChange({ ...filter, ...patch });

  return (
    <Form>
      <div>
        <SearchField
          type="search"
          label={t('agenda.list.filter.search')}
          value={filter.search ?? ''}
          onChange={event => update({ search: event.target.value || null })}
        />
      </div>

      <div>
        <OrganizationSelectPicker
          label={t('agenda.list.filter.organization')}
          mine={canSeeAll === false}
          value={filter.organization ?? null}
          onChange={organization =>
            update({
              organization:
                organization ?
                  { id: organization.id, name: organization.name }
                : null,
            })
          }
        />
      </div>

      <div>
        <VenueFilter
          value={filter.place ?? null}
          onChange={place => update({ place })}
        />
      </div>

      <div>
        <SelectTags
          defaultTags={[]}
          selectedTags={filter.tagIds ?? null}
          tagType={TagType.Event}
          setSelectedTags={tagIds =>
            update({ tagIds: tagIds.length ? tagIds : null })
          }
          label={t('agenda.list.filter.tags')}
        />
      </div>

      <div>
        <MultiSelectFilter<EventStatus>
          label={t('agenda.list.filter.status')}
          options={STATUSES.map(status => ({
            value: status,
            label: t(`agenda.status.${status}`),
          }))}
          value={filter.status ?? []}
          onChange={status => update({ status: status.length ? status : null })}
        />
      </div>

      <div>
        <MultiSelectFilter<EventPublicationState>
          label={t('agenda.list.filter.publication')}
          options={PUBLICATION_STATES.map(state => ({
            value: state,
            label: `${PUBLICATION_MARKS[state]} ${t(`agenda.publication.${state}`)}`,
          }))}
          value={filter.publication ?? []}
          onChange={publication =>
            update({ publication: publication.length ? publication : null })
          }
        />
      </div>

      <div>
        <DateRangeFilter
          label={t('agenda.list.filter.dates')}
          value={{ from: fromDay(filter.dateFrom), to: fromDay(filter.dateTo) }}
          onChange={range =>
            update({ dateFrom: toDay(range.from), dateTo: toDay(range.to) })
          }
        />
      </div>

      <div>
        <TextField
          select
          sx={{ minWidth: 220 }}
          label={t('agenda.list.filter.ending')}
          value={filter.ending ?? ''}
          onChange={event =>
            update({ ending: (event.target.value as EventEnding) || null })
          }
        >
          <MenuItem value="">{t('agenda.list.filter.endingAny')}</MenuItem>
          <MenuItem value="soon">{t('agenda.list.filter.endingSoon')}</MenuItem>
          <MenuItem value="ended">
            {t('agenda.list.filter.endingEnded')}
          </MenuItem>
        </TextField>
      </div>

      <div>
        <FormControlLabel
          control={
            <Switch
              checked={!!filter.reviewRequested}
              onChange={(_event, checked) =>
                update({ reviewRequested: checked || null })
              }
            />
          }
          label={t('agenda.list.filter.reviewRequested')}
        />
      </div>
    </Form>
  );
}
