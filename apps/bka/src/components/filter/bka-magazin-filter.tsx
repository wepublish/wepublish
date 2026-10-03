import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  AuthorListDocument,
  AuthorSort,
  SortOrder,
  TagListDocument,
  TagType,
} from '@wepublish/website/api';
import { Button, TextField } from '@wepublish/website/builder';
import { useCallback, useId, useState } from 'react';
import { FaSliders } from 'react-icons/fa6';
import { MdSearch } from 'react-icons/md';

import {
  BkaFilterCheckbox,
  BkaFilterGroup,
  BkaFilterGroupTitle,
  BkaFilterLabel,
  BkaFilterOption,
  BkaFilterPanel,
} from './bka-filter-panel';

export const BKA_CATEGORY_NAMES = [
  'Musik',
  'Kunst',
  'Bühne',
  'Film',
  'Literatur',
  'Ausstellungen & Kulturerbe',
  'Begegnungen',
  'Diverses',
];

export type BkaMagazinFilterValue = {
  tags: string[];
  authors: string[];
  title: string;
};

export const emptyBkaMagazinFilter: BkaMagazinFilterValue = {
  tags: [],
  authors: [],
  title: '',
};

export const BkaFilterStickyWrapper = styled('div')`
  position: sticky;
  top: ${({ theme }) => theme.spacing(2)};
  z-index: 30;
`;

export const BkaFilterStickyBar = styled('div')`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1)};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.palette.background.default};
  box-shadow: rgba(0, 0, 0, 0.33) 0 1px 4px 0;
`;

export const BkaFilterButton = styled(Button)``;

export const BkaFilterCount = styled('span')`
  display: block;
  margin-left: ${({ theme }) => theme.spacing(1)};
  padding: 4px;
  border-radius: 800px;
  background-color: ${({ theme }) => theme.palette.common.white};
  color: ${({ theme }) => theme.palette.common.black};
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
`;

export const BkaSearchIcon = styled(MdSearch)`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

export const BkaSearchInput = styled(TextField)`
  width: 100%;
  max-width: 364px;
`;

const toggle = (values: string[], value: string) =>
  values.includes(value) ?
    values.filter(entry => entry !== value)
  : [...values, value];

export type BkaMagazinFilterProps = {
  value: BkaMagazinFilterValue;
  onChange: (value: BkaMagazinFilterValue) => void;
  className?: string;
};

export const BkaSearchField = ({
  value,
  onChange,
  className,
}: BkaMagazinFilterProps) => (
  <BkaSearchInput
    className={className}
    type="text"
    placeholder="Suchen"
    value={value.title}
    onChange={event => onChange({ ...value, title: event.target.value })}
    slotProps={{
      htmlInput: { 'aria-label': 'Suchen' },
      input: {
        startAdornment: <BkaSearchIcon aria-hidden />,
      },
    }}
  />
);

export const BkaMagazinFilter = ({
  value,
  onChange,
  className,
}: BkaMagazinFilterProps) => {
  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const panelId = useId();

  const { data: tagData } = useQuery(TagListDocument, {
    variables: { filter: { type: TagType.Article }, take: 100 },
  });
  const { data: authorData } = useQuery(AuthorListDocument, {
    variables: { take: 100, sort: AuthorSort.Name, order: SortOrder.Ascending },
  });

  const categories = BKA_CATEGORY_NAMES.flatMap(name => {
    const tag = (tagData?.tags?.nodes ?? []).find(entry => entry.tag === name);
    return tag ? [tag] : [];
  });
  const authors = authorData?.authors?.nodes ?? [];
  const activeCount = value.tags.length + value.authors.length;

  const openPanel = useCallback(() => {
    setDraft(value);
    setOpen(true);
  }, [value]);

  const closePanel = useCallback(() => setOpen(false), []);

  const submit = useCallback(() => {
    onChange({ ...value, tags: draft.tags, authors: draft.authors });
    setOpen(false);
  }, [draft.authors, draft.tags, onChange, value]);

  const reset = useCallback(() => {
    setDraft({ ...draft, tags: [], authors: [] });
    onChange({ ...value, tags: [], authors: [] });
    setOpen(false);
  }, [draft, onChange, value]);

  return (
    <BkaFilterStickyWrapper className={className}>
      <BkaFilterStickyBar>
        <BkaFilterButton
          variant="contained"
          type="button"
          onClick={openPanel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={panelId}
          startIcon={<FaSliders size={18} />}
        >
          Filter
          {activeCount > 0 && <BkaFilterCount>{activeCount}</BkaFilterCount>}
        </BkaFilterButton>
      </BkaFilterStickyBar>

      <BkaFilterPanel
        id={panelId}
        open={isOpen}
        onClose={closePanel}
        onSubmit={submit}
        onReset={reset}
      >
        <BkaFilterGroup>
          <BkaFilterGroupTitle>Kategorien</BkaFilterGroupTitle>

          {categories.map(tag => (
            <BkaFilterOption key={tag.id}>
              <BkaFilterCheckbox
                type="checkbox"
                id={`${panelId}-tag-${tag.id}`}
                checked={draft.tags.includes(tag.id)}
                onChange={() =>
                  setDraft({ ...draft, tags: toggle(draft.tags, tag.id) })
                }
              />
              <BkaFilterLabel htmlFor={`${panelId}-tag-${tag.id}`}>
                {tag.tag}
              </BkaFilterLabel>
            </BkaFilterOption>
          ))}
        </BkaFilterGroup>

        <BkaFilterGroup>
          <BkaFilterGroupTitle>Autor*innen</BkaFilterGroupTitle>

          {authors.map(author => (
            <BkaFilterOption key={author.id}>
              <BkaFilterCheckbox
                type="checkbox"
                id={`${panelId}-author-${author.id}`}
                checked={draft.authors.includes(author.id)}
                onChange={() =>
                  setDraft({
                    ...draft,
                    authors: toggle(draft.authors, author.id),
                  })
                }
              />
              <BkaFilterLabel htmlFor={`${panelId}-author-${author.id}`}>
                {author.name}
              </BkaFilterLabel>
            </BkaFilterOption>
          ))}
        </BkaFilterGroup>
      </BkaFilterPanel>
    </BkaFilterStickyWrapper>
  );
};
