import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { FullAuthorFragment } from '@wepublish/editor/api';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ListInput, ListValue } from '../atoms/listInput';
import { AuthorSelectPicker } from './authorSelectPicker';

export interface ArticleAuthor {
  author?: FullAuthorFragment | null;
  role?: string | null;
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

const RoleInput = styled(TextField)`
  flex: 2;
`;

export interface ArticleAuthorListProps {
  value: ListValue<ArticleAuthor>[];
  disabled?: boolean;
  onChange: Dispatch<SetStateAction<ListValue<ArticleAuthor>[]>>;
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
            label={t('articleEditor.panels.authorRole')}
            onChange={event =>
              onItemChange({ ...articleAuthor, role: event.target.value })
            }
          />
        </FlexRow>
      )}
    </ListInput>
  );
}
