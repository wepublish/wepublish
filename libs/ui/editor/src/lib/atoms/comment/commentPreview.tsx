import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Stack,
} from '@mui/material';
import {
  CommentRevisionFragment,
  CommentRevisionInput,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { toPlaintext } from '@wepublish/richtext';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAttachFile,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdTag,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Form } from 'rsuite';

import { RichTextBlock } from '../../blocks/richTextBlock/rich-text-block';
import { RichTextBlockValue } from '../../blocks/types';
import { humanReadableCommentState } from './commentStateDropdown';
import { CreateCommentBtn } from './createCommentBtn';

export function CommentRevisionView({
  revision,
}: {
  revision: CommentRevisionFragment | undefined;
}) {
  const { t } = useTranslation();
  if (!revision) {
    return (
      <h6>
        <MdAttachFile />
        <span style={{ marginLeft: '5px' }}>
          {t('commentPreview.noContent')}
        </span>
      </h6>
    );
  }
  return (
    <>
      {revision.title && <h6>{revision.title}</h6>}

      {revision.lead && <p>{revision.lead}</p>}

      {revision.text && (
        <div style={{ marginTop: '5px' }}>
          {toPlaintext(revision.text.content)}
        </div>
      )}
    </>
  );
}

function CommentTags({
  comment,
}: {
  comment: FullCommentFragment | undefined;
}) {
  const { t } = useTranslation();
  const tags = comment?.tags;
  return (
    <>
      <h6 style={{ marginBottom: '5px' }}>{t('tags.overview.title')}</h6>
      {tags &&
        tags.map(tag => (
          <div key={tag.id}>
            <MdTag /> {tag.tag}
          </div>
        ))}
      {(!tags || !tags.length) && <p>{t('commentPreview.noTags')}</p>}
    </>
  );
}

function CommentSource({
  comment,
}: {
  comment: FullCommentFragment | undefined;
}) {
  const { t } = useTranslation();
  const source = comment?.source;
  const label = (
    <h6 style={{ marginBottom: '5px' }}>{t('commentPreview.source')}</h6>
  );

  if (source) {
    return (
      <>
        {label}
        {source}
      </>
    );
  }
  return (
    <>
      {label}
      {t('commentPreview.noSource')}
    </>
  );
}

export interface RevisionProps {
  revision?: CommentRevisionInput;
  setRevision?: Dispatch<SetStateAction<CommentRevisionInput | undefined>>;
}

interface CommentPreviewProps extends RevisionProps {
  comment: FullCommentFragment;
  originComment?: FullCommentFragment;
}

export function CommentPreview({
  comment,
  originComment,
  revision,
  setRevision,
}: CommentPreviewProps) {
  const { t } = useTranslation();
  const revisions = comment.revisions;
  const lastRevision =
    revisions?.length ? revisions[revisions.length - 1] : undefined;
  const expanded = useMemo(
    () => comment.id === originComment?.id,
    [comment.id, originComment?.id]
  );
  const displayComment = useMemo(
    () => (expanded ? originComment || comment : comment),
    [originComment, comment, expanded]
  );
  const [panelExpanded, setPanelExpanded] = useState<boolean>(!!expanded);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const element = document.getElementById(`comment-${comment.id}`);
    if (!element) {
      return;
    }
    element.scrollIntoView({ behavior: 'smooth' });
  }, [originComment]);

  function getPanelHeader() {
    const createdAtReadable = new Date(displayComment.createdAt).toLocaleString(
      'de-CH',
      {
        timeZone: 'europe/zurich',
      }
    );

    if (displayComment.guestUsername) {
      return `${displayComment.guestUsername} (${t(
        'commentHistory.guestUser'
      )}) | ${createdAtReadable}`;
    }

    const user = displayComment.user;
    let userName;
    if (!user) {
      userName = t('commentHistory.unknownUser');
    } else {
      userName = user?.firstName ? `${user.firstName} ${user.name}` : user.name;
    }

    return `${userName} | ${createdAtReadable} | ${t(
      humanReadableCommentState(displayComment.state)
    )}`;
  }

  return (
    <Accordion
      defaultExpanded={!!expanded}
      style={
        expanded ?
          {
            border: `1px solid var(--rs-text-primary)`,
            backgroundColor: 'var(--rs-bg-well)',
          }
        : {}
      }
    >
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between' }}
        >
          <Box>{getPanelHeader()}</Box>
          <Box>
            {panelExpanded && <MdExpandMore />}
            {!panelExpanded && <MdExpandLess />}
          </Box>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        {!expanded && (
          <Grid
            container
            spacing={2}
            style={{ maxWidth: '100%' }}
          >
            <Grid
              container
              spacing={2}
              style={{ maxWidth: '100%' }}
            >
              {/* title, lead, text */}
              <Grid size={{ xs: 9 }}>
                <CommentRevisionView revision={lastRevision} />
              </Grid>
              {/* tags & source */}
              <Grid size={{ xs: 3 }}>
                <div>
                  <CommentTags comment={displayComment} />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <CommentSource comment={displayComment} />
                </div>
              </Grid>
            </Grid>
          </Grid>
        )}
        {expanded && (
          <Grid
            container
            spacing={2}
            style={{ maxWidth: '100%' }}
          >
            <Grid
              container
              spacing={2}
            >
              {/* comment title */}
              <Grid size={{ xs: 12 }}>
                <Form.Label>{t('commentEditView.title')}</Form.Label>
                <Form.Control
                  name="commentTitle"
                  value={revision?.title || ''}
                  placeholder={t('commentEditView.title')}
                  onChange={(title: string) => {
                    if (setRevision) {
                      setRevision(oldRevision => ({ ...oldRevision, title }));
                    }
                  }}
                />
              </Grid>
              {/* comment lead */}
              <Grid size={{ xs: 12 }}>
                <Form.Label>{t('commentEditView.lead')}</Form.Label>
                <Form.Control
                  name="commentLead"
                  value={revision?.lead || ''}
                  placeholder={t('commentEditView.lead')}
                  onChange={(lead: string) => {
                    if (setRevision) {
                      setRevision(oldRevision => ({ ...oldRevision, lead }));
                    }
                  }}
                />
              </Grid>
              {/* comment text */}
              <Grid
                size={{ xs: 12 }}
                style={{ marginTop: '20px' }}
              >
                <Form.Label>{t('commentEditView.comment')}</Form.Label>

                <RichTextBlock
                  value={revision?.text}
                  onChange={text => {
                    if (setRevision) {
                      setRevision(oldRevision => ({
                        ...oldRevision,
                        text: text as RichTextBlockValue['richText'],
                      }));
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* actions */}
        <Grid
          size={{ xs: 12 }}
          style={{
            textAlign: 'center',
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          <CreateCommentBtn
            variant="outlined"
            itemID={comment.itemID}
            itemType={comment.itemType}
            parentID={comment.id}
            text={t('replyCommentBtn.reply')}
          />
          {!expanded && (
            <Link to={`/comments/edit/${comment.id}`}>
              <Button
                variant="outlined"
                startIcon={<MdEdit />}
                style={{ marginLeft: '10px' }}
              >
                {t('commentPreview.editComment')}
              </Button>
            </Link>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
