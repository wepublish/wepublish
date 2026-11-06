import styled from '@emotion/styled';
import {
  type FormValues,
  type ItemLayoutProps,
  editorForm,
  useArrayField,
} from '@wepublish/form/editor';
import { useWatch } from 'react-hook-form';

import { commentSchema } from './comment.schema';

const RatingRow = editorForm.fieldsFor(commentSchema, 'ratingOverrides.*');

const Rows = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export function RatingOverrideRow({ index }: ItemLayoutProps) {
  const answer = useWatch<
    FormValues<typeof commentSchema>,
    `ratingOverrides.${number}.answer`
  >({ name: `ratingOverrides.${index}.answer` });

  return (
    <RatingRow.Field
      name="value"
      label={<span>{answer}</span>}
    />
  );
}

export function RatingOverrides() {
  const list = useArrayField();

  return (
    <Rows
      role="group"
      aria-label={typeof list.label === 'string' ? list.label : undefined}
    >
      {list.items.map(item => (
        <div key={item.key}>{list.renderItem(item.index)}</div>
      ))}
    </Rows>
  );
}
