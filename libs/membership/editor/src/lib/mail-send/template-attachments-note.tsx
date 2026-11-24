import { useQuery } from '@apollo/client/react';
import { Typography } from '@mui/material';
import { DocumentListDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

export type TemplateAttachmentsNoteProps = {
  /** The documents the chosen template attaches, in their order. */
  attachmentIds: string[];
};

/**
 * Says which documents every mail of the send carries, so nobody sends a
 * contract or an invoice without knowing. Their names come from the document
 * list; one the list cannot name is shown by its id.
 */
export function TemplateAttachmentsNote({
  attachmentIds,
}: TemplateAttachmentsNoteProps) {
  const { t } = useTranslation();
  const { data } = useQuery(DocumentListDocument, {
    variables: { take: 200 },
    skip: !attachmentIds.length,
    fetchPolicy: 'cache-and-network',
  });

  if (!attachmentIds.length) {
    return null;
  }

  const documents = data?.documents.nodes ?? [];
  const names = attachmentIds
    .map(id => {
      const document = documents.find(candidate => candidate.id === id);

      return document?.title || document?.filename || id;
    })
    .join(', ');

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ marginTop: 1.5 }}
    >
      {t('mailSend.attachments', { count: attachmentIds.length, names })}
    </Typography>
  );
}
