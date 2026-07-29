import { ApolloError, useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import {
  SortOrder,
  Tag,
  TagDocument,
  TagQuery,
  TagQueryVariables,
  TagSort,
  TagType,
  useTagListQuery,
} from '@wepublish/editor/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Divider as RDivider,
  Message,
  Pagination as RPagination,
  TagPicker,
  toaster,
} from 'rsuite';
import { ItemDataType } from 'rsuite/esm/@types/common';

import { DEFAULT_MAX_TABLE_PAGES } from '../../utility';

const Divider = styled(RDivider)`
  margin: '12px 0';
`;

const Pagination = styled(RPagination)`
  margin: 0 12px 12px;
`;

interface SelectTagsProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  tagType: TagType;
  defaultTags: Pick<Tag, 'id' | 'tag'>[];
  selectedTags?: string[] | null;
  setSelectedTags(tags: string[]): void;
  placeholder?: string;
}

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
    })) as ItemDataType<string | number>[]
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
  const showErrors = (error: ApolloError): void => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error.message}
      </Message>
    );
  };

  /**
   * Loading tags
   */
  const take = 50;

  const { data: tagsData, refetch } = useTagListQuery({
    variables: {
      filter: {
        type: tagType,
      },
      sort: TagSort.Tag,
      order: SortOrder.Ascending,
      take,
      skip: (page - 1) * take,
    },
    onError: showErrors,
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

  return (
    <TagPicker
      block
      virtualized
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      name={name}
      value={selectedTags}
      data={availableTags}
      cacheData={cacheData}
      onSearch={word => {
        setPage(1);
        refetch({
          filter: {
            tag: word,
            type: tagType,
          },
        });
      }}
      onSelect={(value, item, event) => {
        setCacheData([...cacheData, item]);
        setPage(1);
      }}
      onChange={(value, item) => {
        setSelectedTags(value);
      }}
      renderMenu={menu => {
        return (
          <>
            {menu}

            <Divider />

            <Pagination
              limit={take}
              maxButtons={DEFAULT_MAX_TABLE_PAGES}
              first
              last
              prev
              next
              ellipsis
              boundaryLinks
              layout={['total', '-', '|', 'pager']}
              total={tagsData?.tags?.totalCount ?? 0}
              activePage={page}
              onChangePage={setPage}
            />
          </>
        );
      }}
    />
  );
}
