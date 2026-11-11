import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';
import { PeerProfileDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';

import { useDocumentUrl } from '../../hooks/useDocumentUrl';
import { enqueueSnackbar } from '../../snackbar';

const IconButton = styled(MuiIconButton)`
  &&:not([data-with-text]) {
    width: 28px;
    height: 28px;
  }
`;

export function usePollAnswerVoteUrl(): (
  answerId: string
) => string | undefined {
  const documentUrl = useDocumentUrl();
  const { data } = useQuery(PeerProfileDocument);
  const websiteUrl = data?.peerProfile?.websiteURL;

  return (answerId: string) => {
    if (!websiteUrl) {
      return undefined;
    }

    try {
      const voteUrl = new URL(documentUrl ?? '', websiteUrl);
      voteUrl.searchParams.set('answerId', answerId);

      return voteUrl.toString();
    } catch (e) {
      return undefined;
    }
  };
}

export interface CopyPollAnswerVoteUrlButtonProps {
  voteUrl?: string;
}

export function CopyPollAnswerVoteUrlButton({
  voteUrl,
}: CopyPollAnswerVoteUrlButtonProps) {
  const { t } = useTranslation();

  async function copyVoteUrlIntoClipboard(): Promise<void> {
    if (!voteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(voteUrl);

      enqueueSnackbar(t('pollAnswer.urlCopied'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } catch (e) {
      enqueueSnackbar(t('pollAnswer.urlCopyingFailed'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  }

  return (
    <Tooltip
      title={
        <>
          {t('pollAnswer.copyVoteUrl')}

          {voteUrl && (
            <>
              <br />
              {voteUrl}
            </>
          )}
        </>
      }
    >
      <IconButton
        aria-label={t('pollAnswer.copyVoteUrl')}
        size="small"
        disabled={!voteUrl}
        onClick={copyVoteUrlIntoClipboard}
      >
        <MdContentCopy />
      </IconButton>
    </Tooltip>
  );
}
