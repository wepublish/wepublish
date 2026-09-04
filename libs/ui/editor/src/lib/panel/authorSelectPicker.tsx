import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  AuthorListDocument,
  FullAuthorFragment,
  useAuthorListQuery,
  useCreateAuthorMutation,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, SelectPicker, toaster } from 'rsuite';

import { PeerAvatar } from '../atoms/peer/peerAvatar';
import { getOperationNameFromDocument } from '../utility';

const ButtonWrapper = styled.div`
  margin: 10px;
`;

export interface AuthorSelectPickerProps {
  readonly className?: string;
  readonly disabled?: boolean;
  readonly name?: string;
  readonly selectedAuthor?: FullAuthorFragment | null;
  /** Authors already picked elsewhere; they are hidden from the options. */
  readonly excludeIds?: readonly string[];
  setSelectedAuthor(author: FullAuthorFragment | null): void;
}

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

  const { data: authorsData } = useAuthorListQuery({
    variables: { filter: authorsFilter || undefined, take: 10 },
    onError: showErrors,
  });

  const [createAuthor] = useCreateAuthorMutation({
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

  return (
    <SelectPicker
      block
      cleanable
      virtualized
      disabled={disabled}
      className={className}
      name={name}
      value={selectedAuthor?.id ?? null}
      data={availableAuthors.map(author => ({
        value: author.id,
        label: author.name,
        peer: author.peer,
      }))}
      placeholder={t('articleEditor.panels.selectAuthor')}
      onSearch={searchKeyword => {
        setAuthorsFilter(searchKeyword);
      }}
      onChange={authorId => {
        setSelectedAuthor(
          availableAuthors.find(({ id }) => id === authorId) ?? null
        );
      }}
      onExit={() => {
        setAuthorsFilter('');
      }}
      renderMenuItem={(
        label: ReactNode,
        item: { peer?: FullAuthorFragment['peer'] }
      ) => <PeerAvatar peer={item.peer}>{label}</PeerAvatar>}
      renderExtraFooter={() =>
        authorsFilter &&
        !authorsData?.authors.nodes.length && (
          <ButtonWrapper>
            <Button
              onClick={() => handleCreateAuthor()}
              appearance="primary"
            >
              {t('articles.panels.createAuthorProfile', {
                name: authorsFilter,
              })}
            </Button>
          </ButtonWrapper>
        )
      }
    />
  );
}
