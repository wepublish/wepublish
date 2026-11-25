import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { ListInput } from '../atoms/listInput';
import { AuthorSelectPicker } from '../panel/authorSelectPicker';
import { AuthorsBlockValue } from './types';

const AuthorsBlockWrapper = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

/**
 * A title and the chosen authors (e.g. the team or a board), in an order that
 * can be changed by dragging.
 */
export const AuthorsBlock = ({
  value,
  onChange,
  disabled,
}: BlockProps<AuthorsBlockValue>) => {
  const { t } = useTranslation();

  const chosenIds = useMemo(
    () =>
      value.authors.flatMap(({ value: author }) => (author ? [author.id] : [])),
    [value.authors]
  );

  return (
    <AuthorsBlockWrapper>
      <TextField
        label={t('blocks.authors.title')}
        value={value.title}
        disabled={disabled}
        onChange={event => onChange({ ...value, title: event.target.value })}
      />

      <ListInput
        value={value.authors}
        disabled={disabled}
        defaultValue={null}
        label={t('blocks.authors.addAuthor')}
        onChange={authors => onChange({ ...value, authors })}
      >
        {({ value: author, onChange: onAuthorChange }) => (
          <AuthorSelectPicker
            selectedAuthor={author}
            disabled={disabled}
            excludeIds={chosenIds}
            setSelectedAuthor={onAuthorChange}
          />
        )}
      </ListInput>
    </AuthorsBlockWrapper>
  );
};
