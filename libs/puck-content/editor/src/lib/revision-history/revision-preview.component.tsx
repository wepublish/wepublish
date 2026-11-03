import styled from '@emotion/styled';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { createUsePuck, Render } from '@puckeditor/core';
import { getAuthorName } from '@wepublish/ui/editor';
import { format } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { ReactNode, SyntheticEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdErrorOutline, MdHistory } from 'react-icons/md';

import {
  PuckRevisionPreview,
  PuckRevisionPreviewContext,
  usePuckRevisionPreview,
} from './revision-preview.context';
import {
  useEscapeKey,
  useRevisionPreviewController,
} from './revision-preview.helpers';

const usePuck = createUsePuck();

const Banner = styled('section')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  padding: ${({ theme }) => theme.spacing(1.25, 2)};
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};
  background-color: ${({ theme }) =>
    `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`};
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

const BannerIcon = styled('span')<{ failed: boolean }>`
  display: inline-flex;
  font-size: 24px;
  color: ${({ theme, failed }) =>
    failed ? theme.vars.palette.error.main : theme.vars.palette.primary.main};
`;

const BannerText = styled('div')`
  display: grid;
  flex: 1 1 280px;
  min-width: 0;
`;

const BannerActions = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-left: auto;
`;

const ReadOnly = styled('div')`
  display: contents;
`;

const dateLocales: Record<string, typeof enUS> = { en: enUS, de, fr };

const preventInteraction = (event: SyntheticEvent) => event.preventDefault();

function useRevisionPreviewMessages(preview: PuckRevisionPreview) {
  const { t } = useTranslation();
  const { state } = preview;

  if (state.status === 'idle') {
    return null;
  }

  const date = new Date(state.revision.createdAt);
  const author = getAuthorName(state.revision.author);
  const title =
    author ?
      t('puck.revisionPreview.viewing', { date, author })
    : t('puck.revisionPreview.viewingNoAuthor', { date });
  const detail = {
    loading: t('puck.revisionPreview.loading'),
    failed: t('puck.revisionPreview.failed'),
    ready: t('puck.revisionPreview.readOnly'),
  }[state.status];

  return { title, detail };
}

export function RevisionPreviewProvider({ children }: { children: ReactNode }) {
  const preview = useRevisionPreviewController();
  const messages = useRevisionPreviewMessages(preview);

  useEscapeKey(
    document,
    preview.state.status === 'idle' ? undefined : preview.close
  );

  return (
    <PuckRevisionPreviewContext.Provider value={preview}>
      {children}

      <Box
        component="span"
        role="status"
        aria-live="polite"
        sx={visuallyHidden}
      >
        {messages && `${messages.title}. ${messages.detail}`}
      </Box>
    </PuckRevisionPreviewContext.Provider>
  );
}

export function RevisionPreviewBanner() {
  const { t, i18n } = useTranslation();
  const preview = usePuckRevisionPreview();
  const messages = useRevisionPreviewMessages(preview);
  const [confirming, setConfirming] = useState(false);
  const { state } = preview;

  if (state.status === 'idle' || !messages) {
    return null;
  }

  const failed = state.status === 'failed';
  const revisionDate = format(
    new Date(state.revision.createdAt),
    'dd MMM yyyy, HH:mm',
    { locale: dateLocales[i18n.language] ?? enUS }
  );

  return (
    <Banner aria-label={t('puck.revisionPreview.label')}>
      <BannerIcon
        failed={failed}
        aria-hidden
      >
        {state.status === 'loading' ?
          <CircularProgress size={20} />
        : failed ?
          <MdErrorOutline />
        : <MdHistory />}
      </BannerIcon>

      <BannerText>
        <Typography
          variant="subtitle2"
          component="p"
          noWrap
        >
          {messages.title}
        </Typography>

        <Typography
          variant="body2"
          component="p"
          color={failed ? 'error' : 'text.secondary'}
        >
          {messages.detail}
        </Typography>
      </BannerText>

      <BannerActions>
        <Button
          variant="text"
          onClick={preview.close}
        >
          {t('puck.revisionPreview.back')}
        </Button>

        {failed ?
          <Button
            variant="outlined"
            onClick={preview.retry}
          >
            {t('puck.revisionPreview.retry')}
          </Button>
        : <Button
            variant="contained"
            disabled={state.status !== 'ready'}
            onClick={() => setConfirming(true)}
          >
            {t('puck.revisionPreview.restore')}
          </Button>
        }
      </BannerActions>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
      >
        <DialogTitle>{t('versionHistory.confirm.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('versionHistory.confirm.message', { date: revisionDate })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)}>
            {t('versionHistory.confirm.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirming(false);
              preview.restore(state.revision.id);
            }}
          >
            {t('versionHistory.confirm.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Banner>
  );
}

export function RevisionPreviewFrame({
  children,
  document: frameDocument,
}: {
  children: ReactNode;
  document?: Document;
}) {
  const preview = usePuckRevisionPreview();
  const editorConfig = usePuck(puck => puck.config);
  const { state } = preview;

  useEscapeKey(
    frameDocument === document ? undefined : frameDocument,
    state.status === 'idle' ? undefined : preview.close
  );

  if (state.status !== 'ready') {
    return children;
  }

  return (
    <ReadOnly
      onClickCapture={preventInteraction}
      onSubmitCapture={preventInteraction}
    >
      <Render
        config={state.content.config ?? editorConfig}
        data={state.content.data}
      />
    </ReadOnly>
  );
}
