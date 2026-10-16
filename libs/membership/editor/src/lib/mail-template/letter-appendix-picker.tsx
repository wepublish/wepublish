import { useQuery } from '@apollo/client/react';
import { DocumentListDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MenuItem, TextField } from '@mui/material';

const PDF = 'application/pdf';

export type LetterAppendixPickerProps = {
  value: string | null;
  onChange: (documentId: string | null) => void;
};

/**
 * Pick an uploaded pdf (e.g. a static QR-bill) to print after a template's
 * letter pages. Uploads happen under "Dokumente".
 */
export function LetterAppendixPicker({
  value,
  onChange,
}: LetterAppendixPickerProps) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(DocumentListDocument, {
    variables: { take: 200 },
    fetchPolicy: 'cache-and-network',
  });

  const options = (data?.documents.nodes ?? [])
    .filter(document => document.mimeType === PDF)
    .map(document => ({
      label: document.title || document.filename || document.id,
      value: document.id,
    }));

  return (
    <TextField
      select
      fullWidth
      disabled={loading && !options.length}
      value={value ?? ''}
      onChange={event => onChange(event.target.value || null)}
      slotProps={{ select: { displayEmpty: true } }}
    >
      <MenuItem value="">{t('mailTemplates.edit.letterAppendixNone')}</MenuItem>
      {options.map(option => (
        <MenuItem
          key={option.value}
          value={option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
