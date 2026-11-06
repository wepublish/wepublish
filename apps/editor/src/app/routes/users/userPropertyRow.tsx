import styled from '@emotion/styled';
import { editorForm } from '@wepublish/form/editor';

import { userSchema } from './user.schema';

const PropertyRow = editorForm.fieldsFor(userSchema, 'properties.*');

const Line = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export function UserPropertyRow() {
  return (
    <Line>
      <PropertyRow.Field name="key" />
      <PropertyRow.Field name="value" />
      <PropertyRow.Field name="public" />
    </Line>
  );
}
