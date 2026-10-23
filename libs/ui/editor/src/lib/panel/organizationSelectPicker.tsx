import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField } from '@mui/material';
import {
  TinyOrganizationFragment,
  TinyOrganizationListDocument,
} from '@wepublish/editor/api';
import { ReactNode, useMemo, useState } from 'react';

export type OrganizationOption = Pick<TinyOrganizationFragment, 'id' | 'name'>;

export interface OrganizationSelectPickerProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  label: string;
  helperText?: ReactNode;
  error?: boolean;
  mine?: boolean;
  value: OrganizationOption | null;
  onChange(organization: OrganizationOption | null): void;
}

export function OrganizationSelectPicker({
  className,
  disabled,
  name,
  label,
  helperText,
  error,
  mine,
  value,
  onChange,
}: OrganizationSelectPickerProps) {
  const [search, setSearch] = useState('');

  const { data } = useQuery(TinyOrganizationListDocument, {
    variables: {
      filter: {
        ...(mine ? { mine: true } : {}),
        ...(search ? { name: search } : {}),
      },
      take: 10,
    },
  });

  const options = useMemo(() => {
    const nodes: OrganizationOption[] = data?.organizations.nodes ?? [];

    if (value && !nodes.some(({ id }) => id === value.id)) {
      return [...nodes, value];
    }

    return nodes;
  }, [data, value]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={organization => organization.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={options => options}
      value={value}
      onChange={(_event, organization) => onChange(organization)}
      onInputChange={(_event, input, reason) =>
        setSearch(reason === 'input' ? input : '')
      }
      disabled={disabled}
      className={className}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
          label={label}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
