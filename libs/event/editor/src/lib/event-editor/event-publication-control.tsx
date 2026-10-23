import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { EditorEventFragment } from '@wepublish/editor/api';
import { EditorHeaderButton, StateColor } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCloudOff, MdCloudUpload, MdDoneAll, MdUndo } from 'react-icons/md';

import {
  formatEventDateTime,
  formatRelativeTime,
} from '../event-list/event-format';
import { PublishEventDialog } from './publish-event-dialog';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type EventStateSource = Pick<
  EditorEventFragment,
  'draft' | 'pending' | 'published' | 'reviewRequestedAt'
>;

export const eventEditorState = (
  event: EventStateSource | null | undefined,
  now: Date,
  t: Translate,
  language: string
): { color: StateColor; label: string } => {
  if (!event) {
    return { color: StateColor.draft, label: t('agenda.editor.state.new') };
  }

  if (event.reviewRequestedAt) {
    return {
      color: StateColor.pending,
      label: t('agenda.publication.reviewRequestedAgo', {
        time: formatRelativeTime(event.reviewRequestedAt, now, language),
      }),
    };
  }

  if (event.pending) {
    return {
      color: StateColor.pending,
      label: t('agenda.editor.state.scheduled', {
        date: formatEventDateTime(event.pending.publishedAt ?? now, language),
      }),
    };
  }

  if (event.published) {
    return {
      color: StateColor.published,
      label:
        event.draft ?
          t('agenda.editor.state.publishedWithDraft')
        : t('agenda.publication.published'),
    };
  }

  return { color: StateColor.draft, label: t('agenda.publication.draft') };
};

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

type Confirming = 'review' | 'unpublish' | null;

export interface EventPublicationControlProps {
  event: EditorEventFragment;
  now: Date;
  disabled: boolean;
  hasChanges?: boolean;
  onPublish(publishAt: Date | null): void;
  onUnpublish(): void;
  onRequestReview(): void;
  onWithdrawReview(): void;
}

export function EventPublicationControl({
  event,
  now,
  disabled,
  hasChanges = false,
  onPublish,
  onUnpublish,
  onRequestReview,
  onWithdrawReview,
}: EventPublicationControlProps) {
  const { t, i18n } = useTranslation();
  const [publishing, setPublishing] = useState(false);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const viewerCan = event.viewerCan;

  if (!viewerCan) {
    return null;
  }

  const state = eventEditorState(event, now, t, i18n.language);
  const isPublic = !!event.published || !!event.pending;
  const reviewing = viewerCan.publish === false;
  const nothingToPublish = !event.draft && !event.pending && !hasChanges;

  return (
    <>
      <VisuallyHidden
        role="status"
        aria-live="polite"
      >
        {state.label}
      </VisuallyHidden>

      {viewerCan.publish && isPublic && (
        <EditorHeaderButton
          variant="outlined"
          icon={<MdCloudOff />}
          label={t('agenda.editor.unpublish.button')}
          collapse="md"
          disabled={disabled}
          onClick={() => setConfirming('unpublish')}
        />
      )}

      {viewerCan.publish && (
        <EditorHeaderButton
          variant="contained"
          icon={<MdCloudUpload />}
          label={t('agenda.editor.publish.button')}
          title={
            nothingToPublish ? t('agenda.editor.publish.nothingNew') : undefined
          }
          collapse={false}
          disabled={disabled || nothingToPublish}
          onClick={() => setPublishing(true)}
        />
      )}

      {reviewing && viewerCan.withdrawReview && event.reviewRequestedAt && (
        <EditorHeaderButton
          variant="outlined"
          icon={<MdUndo />}
          label={t('agenda.editor.review.withdraw')}
          collapse={false}
          disabled={disabled}
          onClick={onWithdrawReview}
        />
      )}

      {reviewing && viewerCan.requestReview && !event.reviewRequestedAt && (
        <EditorHeaderButton
          variant="contained"
          icon={<MdDoneAll />}
          label={t('agenda.editor.review.request')}
          collapse={false}
          disabled={disabled}
          onClick={() => setConfirming('review')}
        />
      )}

      {publishing && (
        <PublishEventDialog
          open
          now={now}
          onClose={() => setPublishing(false)}
          onConfirm={publishAt => {
            setPublishing(false);
            onPublish(publishAt);
          }}
        />
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={confirming !== null}
        onClose={() => setConfirming(null)}
      >
        <DialogTitle>
          {confirming === 'unpublish' ?
            t('agenda.editor.unpublish.title')
          : t('agenda.editor.review.confirmTitle')}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {confirming === 'unpublish' ?
              t('agenda.editor.unpublish.body')
            : event.organization ?
              t('agenda.editor.review.confirmBody', {
                organization: event.organization.name,
              })
            : t('agenda.editor.review.confirmBodyAgendaTeam')}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirming(null)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              const action = confirming;
              setConfirming(null);

              if (action === 'unpublish') {
                onUnpublish();
              } else {
                onRequestReview();
              }
            }}
          >
            {confirming === 'unpublish' ?
              t('agenda.editor.unpublish.confirm')
            : t('agenda.editor.review.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
