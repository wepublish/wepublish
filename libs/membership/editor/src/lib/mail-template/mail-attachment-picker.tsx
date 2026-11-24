import { useQuery } from '@apollo/client/react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { DocumentListDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

/** Only .docx can be filled in; the old binary .doc cannot. */
export const DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type Option = { id: string; label: string };

export type MailAttachmentPickerProps = {
  value: string[];
  onChange: (documentIds: string[]) => void;
  /** Id of the visible label, for the field's accessible name. */
  labelId?: string;
};

/**
 * Pick the Word documents (.docx) every mail from a template carries, filled
 * in and converted to pdf. They are attached in the order they were picked.
 * Uploads happen under "Dokumente".
 */
export function MailAttachmentPicker({
  value,
  onChange,
  labelId,
}: MailAttachmentPickerProps) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(DocumentListDocument, {
    variables: { take: 200 },
    fetchPolicy: 'cache-and-network',
  });

  const options: Option[] = (data?.documents.nodes ?? [])
    .filter(document => document.mimeType === DOCX)
    .map(document => ({
      id: document.id,
      label: document.title || document.filename || document.id,
    }));

  // A document not (yet) in the list keeps its place under its id, so loading
  // or a long document list never drops an attachment on save.
  const selected = value.map(
    id => options.find(option => option.id === id) ?? { id, label: id }
  );

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      loading={loading}
      options={options}
      value={selected}
      isOptionEqualToValue={(option, chosen) => option.id === chosen.id}
      getOptionLabel={option => option.label}
      onChange={(_event, picked) => onChange(picked.map(({ id }) => id))}
      noOptionsText={t('mailTemplates.edit.attachmentsNoDocuments')}
      renderValue={(picked, getItemProps) =>
        picked.map((option, index) => (
          <Chip
            size="small"
            label={option.label}
            {...getItemProps({ index })}
            key={option.id}
          />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          placeholder={
            selected.length ? undefined : (
              t('mailTemplates.edit.attachmentsNone')
            )
          }
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-labelledby': labelId,
            },
          }}
        />
      )}
    />
  );
}
