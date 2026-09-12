import styled from '@emotion/styled';
import { createUsePuck, Drawer, Plugin } from '@puckeditor/core';
import { ComponentProps, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';

const usePuck = createUsePuck();

type Overrides = NonNullable<Plugin['overrides']>;
type SearchDrawerProps = ComponentProps<NonNullable<Overrides['drawer']>>;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchField = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--puck-field-space-y) var(--puck-field-space-x);
  border: var(--puck-field-border-width) solid var(--puck-field-color-border);
  border-radius: var(--puck-field-radius);
  background: var(--puck-field-color-bg);
  color: var(--puck-color-text-secondary);

  &:hover {
    border-color: var(--puck-field-color-border-hover);
  }

  &:focus-within {
    border-color: var(--puck-field-color-border-focus);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--puck-field-color-text);
  font-family: var(--puck-font-family);
  font-size: var(--puck-field-font-size);
  outline: none;
`;

const EmptyState = styled.div`
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxs);
  text-align: center;
`;

// Wraps the block list with a search field. Without a query the default
// (categorised) list is shown; with a query a flat list of matching blocks
// replaces it so results are not hidden inside collapsed categories.
export const SearchDrawer = ({ children }: SearchDrawerProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const components = usePuck(puck => puck.config.components);
  const getPermissions = usePuck(puck => puck.getPermissions);

  const normalizedQuery = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return Object.entries(components)
      .map(([name, component]) => ({
        name,
        label: component.label ?? name,
      }))
      .filter(
        ({ name, label }) =>
          label.toLowerCase().includes(normalizedQuery) ||
          name.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [components, normalizedQuery]);

  return (
    <Wrapper>
      <SearchField>
        <MdSearch size={16} />

        <SearchInput
          type="search"
          value={query}
          placeholder={t('puck.search.placeholder', 'Search blocks')}
          aria-label={t('puck.search.placeholder', 'Search blocks')}
          onChange={event => setQuery(event.target.value)}
        />
      </SearchField>

      {!normalizedQuery ?
        children
      : matches.length ?
        <Drawer>
          {matches.map(({ name, label }) => (
            <Drawer.Item
              key={name}
              name={name}
              label={label}
              isDragDisabled={!getPermissions({ type: name }).insert}
            />
          ))}
        </Drawer>
      : <EmptyState>{t('puck.search.noResults', 'No blocks found')}</EmptyState>
      }
    </Wrapper>
  );
};
