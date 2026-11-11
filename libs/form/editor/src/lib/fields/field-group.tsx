import styled from '@emotion/styled';
import { FormHelperText } from '@mui/material';
import type { ChildOverride, FieldPresentation } from '@wepublish/form/core';
import { FormSectionTitle } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { fieldAnatomy, FieldLabel } from '../field-anatomy';

const Group = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  min-width: 0;
`;

export const GroupFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;
`;

export const hasText = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

export const hasGroupTitle = (field: FieldPresentation) =>
  !field.hideLabel && hasText(field.label);

export const groupTitleId = (field: FieldPresentation) => `${field.id}-title`;

export function inheritedFlags(field: FieldPresentation): ChildOverride {
  return {
    ...(field.disabled ? { disabled: true } : {}),
    ...(field.readOnly ? { readOnly: true } : {}),
  };
}

export type FieldGroupProps = {
  field: FieldPresentation;
  showRequired?: boolean;
  children: ReactNode;
};

export function FieldGroup({
  field,
  showRequired = false,
  children,
}: FieldGroupProps) {
  const titled = showRequired ? field : { ...field, required: false };
  const anatomy = fieldAnatomy(titled);
  const hasTitle = hasGroupTitle(field);
  const titleId = groupTitleId(field);

  return (
    <Group
      role="group"
      aria-labelledby={
        hasTitle && anatomy.ariaLabel === undefined ? titleId : undefined
      }
      aria-label={anatomy.ariaLabel}
      aria-describedby={anatomy.helperTextId}
    >
      {hasTitle ?
        <FormSectionTitle id={titleId}>
          <FieldLabel field={titled} />
        </FormSectionTitle>
      : null}
      {anatomy.helperText === undefined ? null : (
        <FormHelperText
          id={anatomy.helperTextId}
          error={field.invalid}
          sx={{ mx: 0, mt: 0 }}
        >
          {anatomy.helperText}
        </FormHelperText>
      )}
      {children}
    </Group>
  );
}
