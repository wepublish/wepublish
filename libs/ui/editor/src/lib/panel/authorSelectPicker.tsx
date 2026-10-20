import { useMutation, useQuery } from '@apollo/client/react';
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
  AuthorListDocument,
  CreateAuthorDocument,
  FullAuthorFragment,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerAvatar } from '../atoms/peer/peerAvatar';
import { humanizeError } from '../humanizeError';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

const ButtonWrapper = styled.div`
  margin: 8px;
`;

export interface AuthorSelectPickerProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  selectedAuthor?: FullAuthorFragment | null;
  /** Authors already picked elsewhere; they are hidden from the options. */
  excludeIds?: string[];
  setSelectedAuthor(author: FullAuthorFragment | null): void;
}

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

export function AuthorSelectPicker({
  className,
  disabled,
  name,
  selectedAuthor,
  excludeIds,
  setSelectedAuthor,
}: AuthorSelectPickerProps) {
  const { t } = useTranslation();
  const [authorsFilter, setAuthorsFilter] = useState('');

  const { data: authorsData } = useQuery(AuthorListDocument, {
    variables: { filter: authorsFilter || undefined, take: 10 },
  });

  const [createAuthor] = useMutation(CreateAuthorDocument, {
    refetchQueries: [getOperationNameFromDocument(AuthorListDocument)],
    onError: showErrors,
  });

  /**
   * Prepare available authors; the selected one is kept so it always has a label.
   */
  const availableAuthors = useMemo(() => {
    const nodes = authorsData?.authors?.nodes ?? [];
    const authors = nodes.filter(
      author =>
        author.id === selectedAuthor?.id || !excludeIds?.includes(author.id)
    );

    if (selectedAuthor && !authors.some(({ id }) => id === selectedAuthor.id)) {
      authors.push(selectedAuthor);
    }

    return authors;
  }, [authorsData, selectedAuthor, excludeIds]);

  async function handleCreateAuthor() {
    const { data } = await createAuthor({
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

    if (data?.createAuthor) {
      setSelectedAuthor(data.createAuthor as FullAuthorFragment);
    }
  }

  const PaperWithCreate = useCallback(
    ({ children, ...props }: PaperProps) => (
      <Paper {...props}>
        {children}

        {authorsFilter && !authorsData?.authors.nodes.length ?
          <>
            <Divider />
            <ButtonWrapper onMouseDown={event => event.preventDefault()}>
              <Button
                variant="contained"
                onClick={() => handleCreateAuthor()}
              >
                {t('articles.panels.createAuthorProfile', {
                  name: authorsFilter,
                })}
              </Button>
            </ButtonWrapper>
          </>
        : null}
      </Paper>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authorsFilter, authorsData, t]
  );

  return (
    <Autocomplete
      options={availableAuthors}
      getOptionLabel={author => author.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={options => options}
      value={selectedAuthor ?? null}
      onChange={(_event, author) => setSelectedAuthor(author)}
      onInputChange={(_event, value, reason) =>
        setAuthorsFilter(reason === 'input' ? value : '')
      }
      disabled={disabled}
      className={className}
      renderOption={({ key, ...props }, author) => (
        <li
          key={key}
          {...props}
        >
          <PeerAvatar peer={author.peer}>{author.name}</PeerAvatar>
        </li>
      )}
      slots={{ paper: PaperWithCreate }}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
          placeholder={t('articleEditor.panels.selectAuthor')}
        />
      )}
    />
  );
}
