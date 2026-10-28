import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  Button,
  Divider,
  Paper,
  PaperProps,
  TextField,
} from '@mui/material';
import {
  AuthorDocument,
  AuthorListDocument,
  AuthorQuery,
  AuthorQueryVariables,
  CreateAuthorDocument,
  FullAuthorFragment,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerAvatar } from '../atoms/peer/peerAvatar';
import { Pagination } from '../listView/pagination';
import { getOperationNameFromDocument } from '../utility';

const ButtonWrapper = styled.div`
  margin: 8px;
`;

const StyledPagination = styled(Pagination)`
  padding: 8px 12px 12px;
`;

const take = 10;

export interface AuthorCheckPickerProps {
  list: FullAuthorFragment[];
  disabled?: boolean;
  onClose?(): void;
  onChange?(authors: FullAuthorFragment[]): void;
}

export function AuthorCheckPicker({
  list,
  disabled,
  onChange,
}: AuthorCheckPickerProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [authorsFilter, setAuthorsFilter] = useState('');
  const [page, setPage] = useState(1);
  const [known, setKnown] = useState<FullAuthorFragment[]>([]);
  const requestedIds = useRef<Set<string>>(new Set());

  const authorsVariables = {
    filter: authorsFilter || undefined,
    take,
    skip: (page - 1) * take,
  };

  const { data, loading } = useQuery(AuthorListDocument, {
    variables: authorsVariables,
  });

  const nodes = data?.authors?.nodes;
  const totalCount = data?.authors?.totalCount ?? 0;

  const PaperWithPager = useCallback(
    ({ children, ...props }: PaperProps) => (
      <Paper {...props}>
        {children}

        {totalCount > take && (
          <>
            <Divider />

            <div onMouseDown={event => event.preventDefault()}>
              <StyledPagination
                compact
                state={{
                  page,
                  limit: take,
                  setPage,
                  setLimit: () => undefined,
                }}
                totalCount={totalCount}
              />
            </div>
          </>
        )}
      </Paper>
    ),
    [page, totalCount]
  );

  const remember = (authors: FullAuthorFragment[]) =>
    setKnown(previous => {
      const ids = new Set(previous.map(({ id }) => id));
      const additions = authors.filter(({ id }) => !ids.has(id));

      return additions.length ? [...previous, ...additions] : previous;
    });

  const selectedAuthors = useMemo(() => {
    const byId = new Map(
      [...known, ...(nodes ?? [])].map(author => [author.id, author])
    );

    return list.map(author =>
      author.name ? author : (byId.get(author.id) ?? author)
    );
  }, [list, known, nodes]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const missing = selectedAuthors.filter(
      author => !author.name && !requestedIds.current.has(author.id)
    );

    if (!missing.length) {
      return;
    }

    missing.forEach(author => requestedIds.current.add(author.id));

    Promise.all(
      missing.map(({ id }) =>
        client
          .query<AuthorQuery, AuthorQueryVariables>({
            query: AuthorDocument,
            variables: { id },
            fetchPolicy: 'cache-first',
          })
          .then(result => result.data?.author)
          .catch(() => null)
      )
    ).then(authors => {
      const found = authors.filter(author => !!author) as FullAuthorFragment[];

      if (found.length) {
        remember(found);
      }
    });
  }, [selectedAuthors, loading, client]);

  const foundAuthors = useMemo(() => {
    const found = nodes ?? [];
    const foundIDs = found.map(author => author.id);

    return [
      ...found,
      ...selectedAuthors.filter(author => !foundIDs.includes(author.id)),
    ];
  }, [nodes, selectedAuthors]);

  const [createAuthor] = useMutation(CreateAuthorDocument, {
    refetchQueries: [getOperationNameFromDocument(AuthorListDocument)],
  });

  async function handleCreateAuthor() {
    await createAuthor({
      variables: {
        name: authorsFilter,
        slug: slugify(authorsFilter),
        hideOnArticle: false,
        hideOnTeam: false,
        hideOnTeaser: false,
        links: [],
        tagIds: [],
        bio: undefined,
      },
    });
  }

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      options={foundAuthors}
      value={selectedAuthors}
      getOptionLabel={author => author.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={options => options}
      inputValue={authorsFilter}
      onInputChange={(_event, searchKeyword, reason) => {
        if (reason !== 'reset') {
          setAuthorsFilter(searchKeyword);
          setPage(1);
        }
      }}
      onChange={(_event, authors) => onChange?.(authors)}
      slots={{ paper: PaperWithPager }}
      renderOption={({ key, ...props }, author) => (
        <li
          key={key}
          {...props}
        >
          <PeerAvatar peer={author.peer}>{author.name}</PeerAvatar>
        </li>
      )}
      noOptionsText={
        authorsFilter ?
          <ButtonWrapper>
            <Button
              variant="contained"
              onClick={() => handleCreateAuthor()}
            >
              {t('articles.panels.createAuthorProfile', {
                name: authorsFilter,
              })}
            </Button>
          </ButtonWrapper>
        : t('blocks.quote.author')
      }
      sx={{ minWidth: 200 }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={
            selectedAuthors.length ? undefined : t('blocks.quote.author')
          }
        />
      )}
      fullWidth
    />
  );
}
