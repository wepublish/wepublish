import styled from '@emotion/styled';
import { FullAuthorFragment } from '@wepublish/editor/api';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from 'rsuite';

import { ListInput, ListValue } from '../atoms/listInput';
import { AuthorSelectPicker } from './authorSelectPicker';

export interface ArticleAuthor {
  readonly author?: FullAuthorFragment | null;
  readonly role?: string | null;
}

export const formatArticleAuthors = (
  authors: ArticleAuthor[],
  separator = ', '
) =>
  authors
    .flatMap(({ author, role }) =>
      author ? [role ? `${author.name} (${role})` : author.name] : []
    )
    .join(separator);

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  padding: 4px;
`;

const AuthorPicker = styled(AuthorSelectPicker)`
  flex: 3;
`;

const RoleInput = styled(Input)`
  flex: 2;
`;

export interface ArticleAuthorListProps {
  readonly value: ListValue<ArticleAuthor>[];
  readonly disabled?: boolean;
  onChange: React.Dispatch<React.SetStateAction<ListValue<ArticleAuthor>[]>>;
}

export function ArticleAuthorList({
  value,
  disabled,
  onChange,
}: ArticleAuthorListProps) {
  const { t } = useTranslation();

  const selectedIds = useMemo(
    () =>
      value.flatMap(({ value: articleAuthor }) =>
        articleAuthor.author ? [articleAuthor.author.id] : []
      ),
    [value]
  );

  return (
    <ListInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      defaultValue={{ author: null, role: '' }}
    >
      {({ value: articleAuthor, onChange: onItemChange }) => (
        <FlexRow>
          <AuthorPicker
            selectedAuthor={articleAuthor.author}
            disabled={disabled}
            excludeIds={selectedIds}
            setSelectedAuthor={author =>
              onItemChange({ ...articleAuthor, author })
            }
          />

          <RoleInput
            value={articleAuthor.role ?? ''}
            disabled={disabled}
            placeholder={t('articleEditor.panels.authorRole')}
            onChange={role => onItemChange({ ...articleAuthor, role })}
          />
        </FlexRow>
      )}
    </ListInput>
  );
}
