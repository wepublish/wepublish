import { Box, FormControl, FormHelperText, FormLabel } from '@mui/material';
import { useField } from '@wepublish/form/core';
import type {
  RichtextElements,
  RichtextJSONDocument,
} from '@wepublish/richtext';
import { RichTextBlock } from '@wepublish/ui/editor';
import { equals } from 'ramda';
import { useState, type FocusEvent } from 'react';

import { fieldAnatomy } from '../field-anatomy';

const isBlankParagraph = (node: RichtextElements) =>
  node.type === 'paragraph' && !node.content?.length;

const isEmptyDocument = (document: RichtextJSONDocument) =>
  (document.content ?? []).every(isBlankParagraph);

const staysInside = (event: FocusEvent<HTMLElement>) =>
  event.relatedTarget instanceof Node &&
  event.currentTarget.contains(event.relatedTarget);

export function RichTextField() {
  const { ref, ...field } = useField<RichtextJSONDocument | null | undefined>();
  const [emitted, setEmitted] = useState<
    RichtextJSONDocument | null | undefined
  >(undefined);
  const anatomy = fieldAnatomy(field);
  const labelId = `${field.id}-label`;
  const labelledBy =
    anatomy.label === undefined || anatomy.ariaLabel !== undefined ?
      undefined
    : labelId;
  const value = field.value ?? null;

  const change = (document: RichtextJSONDocument | null | undefined) => {
    const next =
      document && isEmptyDocument(document) ? null : (document ?? null);

    setEmitted(next);
    field.onChange(next);
  };

  return (
    <FormControl
      fullWidth
      error={field.invalid}
      disabled={field.disabled}
    >
      {anatomy.label === undefined ? null : (
        <FormLabel
          id={labelId}
          component="div"
        >
          {anatomy.label}
        </FormLabel>
      )}
      <Box
        id={field.id}
        role="group"
        aria-labelledby={labelledBy}
        aria-label={anatomy.ariaLabel}
        aria-describedby={anatomy.helperTextId}
        ref={(element: HTMLDivElement | null) => {
          if (element) {
            ref({
              focus: () =>
                element
                  .querySelector<HTMLElement>('[contenteditable]')
                  ?.focus(),
            });
          }
        }}
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          if (!staysInside(event)) {
            field.onBlur();
          }
        }}
      >
        <RichTextBlock
          value={equals(value, emitted) ? undefined : value}
          disabled={field.disabled || field.readOnly}
          aria-label={anatomy.ariaLabel}
          aria-labelledby={labelledBy}
          onChange={change}
        />
      </Box>
      {anatomy.helperText === undefined ? null : (
        <FormHelperText id={anatomy.helperTextId}>
          {anatomy.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
