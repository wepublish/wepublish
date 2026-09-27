import styled from '@emotion/styled';
import { usePeerProfileQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import {
  IconButton as RIconButton,
  Message,
  toaster,
  Tooltip,
  Whisper,
} from 'rsuite';

import { useDocumentUrl } from '../../hooks/useDocumentUrl';

const IconButton = styled(RIconButton)`
  && {
    width: 28px;
    height: 28px;
  }
`;

export function usePollAnswerVoteUrl(): (
  answerId: string
) => string | undefined {
  const documentUrl = useDocumentUrl();
  const { data } = usePeerProfileQuery();
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

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('pollAnswer.urlCopied')}
        </Message>
      );
    } catch (e) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={3000}
        >
          {t('pollAnswer.urlCopyingFailed')}
        </Message>
      );
    }
  }

  return (
    <Whisper
      speaker={
        <Tooltip>
          {t('pollAnswer.copyVoteUrl')}

          {voteUrl && (
            <>
              <br />
              {voteUrl}
            </>
          )}
        </Tooltip>
      }
    >
      <IconButton
        icon={<MdContentCopy />}
        circle
        size="xs"
        appearance="ghost"
        disabled={!voteUrl}
        onClick={copyVoteUrlIntoClipboard}
      />
    </Whisper>
  );
}
