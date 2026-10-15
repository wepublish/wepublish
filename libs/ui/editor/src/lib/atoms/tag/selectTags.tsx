import { useApolloClient, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  Divider as MuiDivider,
  Paper,
  PaperProps,
  TextField,
} from '@mui/material';
import {
  FullTagFragment,
  SortOrder,
  TagDocument,
  TagListDocument,
  TagQuery,
  TagQueryVariables,
  TagSort,
  TagType,
} from '@wepublish/editor/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { humanizeError } from '../../humanizeError';
import { Pagination } from '../../listView/pagination';
import { enqueueSnackbar } from '../../snackbar';

const Divider = styled(MuiDivider)`
  margin: '12px 0';
`;

const StyledPagination = styled(Pagination)`
  padding: 8px 12px 12px;
`;

interface SelectTagsProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  tagType: TagType;
  defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];
  selectedTags?: string[] | null;
  setSelectedTags(tags: string[]): void;
  placeholder?: string;
}

type LabelledOption = { label: string; value: string };

export function SelectTags({
  className,
  disabled,
  name,
  defaultTags,
  tagType,
  selectedTags,
  setSelectedTags,
  placeholder,
}: SelectTagsProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [page, setPage] = useState(1);
  const [cacheData, setCacheData] = useState(
    defaultTags.map(tag => ({
      label: tag.tag || t('comments.edit.unnamedTag'),
      value: tag.id,
    })) as LabelledOption[]
  );
  const resolvedTagIdsRef = useRef<Set<string>>(new Set());

  /**
   * Resolve labels for pre-selected tags (e.g. restored from a persisted
   * filter) that are not part of the currently loaded page, so they render
   * with their name instead of a bare id.
   */
  useEffect(() => {
    const knownIds = new Set(cacheData.map(item => item.value));
    const idsToResolve = (selectedTags ?? []).filter(
      id => !knownIds.has(id) && !resolvedTagIdsRef.current.has(id)
    );

    if (!idsToResolve.length) {
      return;
    }

    idsToResolve.forEach(id => resolvedTagIdsRef.current.add(id));

    let cancelled = false;

    Promise.all(
      idsToResolve.map(id =>
        client
          .query<TagQuery, TagQueryVariables>({
            query: TagDocument,
            variables: { id },
            fetchPolicy: 'cache-first',
          })
          .then(result => result.data?.tag)
          .catch(() => null)
      )
    ).then(tags => {
      if (cancelled) {
        return;
      }

      const resolved = tags
        .filter((tag): tag is NonNullable<typeof tag> => !!tag)
        .map(tag => ({
          label: tag.tag || t('comments.edit.unnamedTag'),
          value: tag.id,
        }));

      if (!resolved.length) {
        return;
      }

      setCacheData(previous => {
        const known = new Set(previous.map(item => item.value));
        const additions = resolved.filter(item => !known.has(item.value));

        return additions.length ? [...previous, ...additions] : previous;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedTags, cacheData, client, t]);

  /**
   * Error handling
   * @param error
   */
  const showErrors = (error: Error): void => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  /**
   * Loading tags
   */
  const take = 50;

  const { data: tagsData, refetch } = useQuery(TagListDocument, {
    variables: {
      filter: {
        type: tagType,
      },
      sort: TagSort.Tag,
      order: SortOrder.Ascending,
      take,
      skip: (page - 1) * take,
    },
  });

  /**
   * Prepare available tags
   */
  const availableTags = useMemo(() => {
    if (!tagsData?.tags?.nodes) {
      return [];
    }

    return tagsData.tags.nodes.map(tag => ({
      label: tag.tag || t('comments.edit.unnamedTag'),
      value: tag.id,
    }));
  }, [tagsData, t]);

  const labelFor = (id: string) =>
    availableTags.find(option => option.value === id)?.label ??
    (cacheData.find(item => item.value === id)?.label as string) ??
    id;

  const PaperWithPager = useCallback(
    ({ children, ...props }: PaperProps) => (
      <Paper {...props}>
        {children}

        <Divider />

        <div onMouseDown={event => event.preventDefault()}>
          <StyledPagination
            compact
            state={{
              page,
              limit: take,
              setPage,
              setLimit: () => undefined /* page size is fixed here */,
            }}
            totalCount={tagsData?.tags?.totalCount ?? 0}
          />
        </div>
      </Paper>
    ),
    [page, setPage, tagsData]
  );

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      className={className}
      options={[
        ...availableTags.map(option => option.value),
        ...(selectedTags ?? []).filter(
          id => !availableTags.some(option => option.value === id)
        ),
      ]}
      getOptionLabel={id => labelFor(id)}
      filterOptions={options => options}
      onInputChange={(_event, word) => {
        setPage(1);
        refetch({ filter: { tag: word, type: tagType } });
      }}
      value={selectedTags ?? []}
      onChange={(_event, picked) => setSelectedTags(picked)}
      slots={{ paper: PaperWithPager }}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
          placeholder={placeholder}
        />
      )}
      fullWidth
    />
  );
}
