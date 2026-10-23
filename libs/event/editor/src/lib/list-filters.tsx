import styled from '@emotion/styled';
import { FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const FilterForm = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
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

export function FilterSearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange(value: string | null): void;
}) {
  return (
    <SearchField
      type="search"
      label={label}
      value={value ?? ''}
      onChange={event => onChange(event.target.value || null)}
    />
  );
}

export function FilterSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
}) {
  return (
    <FormControlLabel
      label={label}
      control={
        <Switch
          checked={checked}
          onChange={(_event, value) => onChange(value)}
        />
      }
    />
  );
}

const ANY = 'any';

export function TriStateFilter({
  label,
  value,
  yesLabel,
  noLabel,
  onChange,
}: {
  label: string;
  value?: boolean | null;
  yesLabel: string;
  noLabel: string;
  onChange(value: boolean | null): void;
}) {
  const { t } = useTranslation();

  return (
    <TextField
      select
      label={label}
      sx={{ minWidth: 180 }}
      value={value == null ? ANY : String(value)}
      onChange={event =>
        onChange(
          event.target.value === ANY ? null : event.target.value === 'true'
        )
      }
    >
      <MenuItem value={ANY}>{t('agenda.filters.any')}</MenuItem>
      <MenuItem value="true">{yesLabel}</MenuItem>
      <MenuItem value="false">{noLabel}</MenuItem>
    </TextField>
  );
}

export const activeFilterCount = (filter: object) =>
  Object.values(filter).filter(value => value != null && value !== '').length;
