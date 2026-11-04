import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import {
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  IconButtonTooltip,
} from '@wepublish/ui/editor';
import prettyBytes from 'pretty-bytes';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';

import type { DocumentFile } from './document.schema';

export const DocumentFileContext = createContext<DocumentFile | null>(null);

const Thumbnail = styled.img`
  display: block;
  max-width: 100%;
  max-height: 300px;
  margin: 0 auto;
`;

const PublicLink = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  word-break: break-all;
`;

export function DocumentFileDetails() {
  const { t } = useTranslation();
  const file = useContext(DocumentFileContext);

  if (file === null) {
    return null;
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    enqueueSnackbar('', {
      variant: 'success',
      title: t('documents.panels.linkCopied'),
      autoHideDuration: 2000,
    });
  };

  return (
    <>
      {file.thumbnailURL && (
        <Thumbnail
          src={file.thumbnailURL}
          alt={`${file.filename}${file.extension}`}
        />
      )}

      <DescriptionList>
        <DescriptionListItem label={t('documents.panels.filename')}>
          {file.filename || t('documents.panels.untitled')}
          {file.extension}
        </DescriptionListItem>

        {file.createdAt && (
          <DescriptionListItem label={t('documents.panels.created')}>
            {t('documents.panels.createdAt', {
              createdAt: new Date(file.createdAt),
            })}
          </DescriptionListItem>
        )}

        {file.updatedAt && (
          <DescriptionListItem label={t('documents.panels.updated')}>
            {t('documents.panels.updatedAt', {
              updatedAt: new Date(file.updatedAt),
            })}
          </DescriptionListItem>
        )}

        <DescriptionListItem label={t('documents.panels.fileSize')}>
          {prettyBytes(file.fileSize)}
        </DescriptionListItem>

        {file.url && (
          <DescriptionListItem label={t('documents.panels.publicLink')}>
            <PublicLink>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
              >
                {file.url}
              </a>

              <IconButtonTooltip caption={t('documents.overview.copyLink')}>
                <IconButton
                  aria-label={t('documents.overview.copyLink')}
                  size="small"
                  onClick={() => copyLink(file.url ?? '')}
                >
                  <MdContentCopy />
                </IconButton>
              </IconButtonTooltip>
            </PublicLink>
          </DescriptionListItem>
        )}
      </DescriptionList>
    </>
  );
}
