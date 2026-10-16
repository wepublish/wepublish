import { useQuery } from '@apollo/client/react';
import { DocumentListDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { SelectPicker } from 'rsuite';

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
    <SelectPicker
      block
      searchable={options.length > 8}
      loading={loading}
      data={options}
      value={value}
      onChange={next => onChange(next ?? null)}
      // Same as the other pickers in the sticky header row.
      popupStyle={{ zIndex: 100 }}
      placeholder={t('mailTemplates.edit.letterAppendixNone')}
    />
  );
}
