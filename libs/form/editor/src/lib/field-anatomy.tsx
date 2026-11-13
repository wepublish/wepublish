import styled from '@emotion/styled';
import type { InputBaseComponentProps, TextFieldProps } from '@mui/material';
import type { FieldPresentation } from '@wepublish/form/core';
import { InfoTooltip } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type FieldAnatomy = {
  label: ReactNode;
  notchLabel: ReactNode;
  ariaLabel: string | undefined;
  helperText: ReactNode;
  helperTextId: string | undefined;
};

export type TextFieldSlots = {
  input?: { startAdornment?: ReactNode; endAdornment?: ReactNode };
  htmlInput?: InputBaseComponentProps;
  select?: boolean;
};

const isShown = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

const NotchSpacer = styled.span`
  display: inline-block;
  width: 1.25em;
`;

function accessibleLabel(field: FieldPresentation) {
  if (typeof field.label !== 'string') {
    return undefined;
  }

  if (field.hideLabel) {
    return field.label;
  }

  return isShown(field.description) ?
      `${field.label}${field.required ? '*' : ''}`
    : undefined;
}

export function FieldDescription({ description }: { description: ReactNode }) {
  const { t } = useTranslation();

  if (!isShown(description)) {
    return null;
  }

  return (
    <>
      {' '}
      <InfoTooltip
        text={description}
        label={
          typeof description === 'string' ? undefined : t('form.field.moreInfo')
        }
      />
    </>
  );
}

export function FieldLabel({
  field,
  textId,
}: {
  field: FieldPresentation;
  textId?: string;
}) {
  const text = (
    <>
      {field.label}
      {field.required ? '*' : null}
    </>
  );

  return (
    <>
      {textId === undefined ? text : <span id={textId}>{text}</span>}
      <FieldDescription description={field.description} />
    </>
  );
}

export function fieldAnatomy(field: FieldPresentation): FieldAnatomy {
  const helperText = field.invalid ? field.error : field.helperText;
  const hasHelperText = isShown(helperText);

  return {
    label: field.hideLabel ? undefined : <FieldLabel field={field} />,
    notchLabel:
      field.hideLabel ? undefined : (
        <>
          {field.label}
          {isShown(field.description) ?
            <>
              {' '}
              <NotchSpacer />
            </>
          : null}
        </>
      ),
    ariaLabel: accessibleLabel(field),
    helperText: hasHelperText ? helperText : undefined,
    helperTextId: hasHelperText ? `${field.id}-helper-text` : undefined,
  };
}

export function textFieldProps(
  field: FieldPresentation,
  slots: TextFieldSlots = {}
): TextFieldProps {
  const anatomy = fieldAnatomy(field);
  const textId =
    slots.select && !field.hideLabel && anatomy.ariaLabel !== undefined ?
      `${field.id}-label-text`
    : undefined;

  return {
    id: field.id,
    name: field.name,
    label:
      textId === undefined ?
        anatomy.label
      : <FieldLabel
          field={field}
          textId={textId}
        />,
    helperText: anatomy.helperText,
    error: field.invalid,
    required: field.required,
    disabled: field.disabled,
    placeholder: field.placeholder,
    fullWidth: true,
    slotProps: {
      inputLabel: { required: false },
      input: {
        readOnly: field.readOnly,
        label: anatomy.notchLabel,
        ...slots.input,
      },
      htmlInput: { 'aria-label': anatomy.ariaLabel, ...slots.htmlInput },
      ...(textId === undefined ? {} : { select: { labelId: textId } }),
    },
  };
}
