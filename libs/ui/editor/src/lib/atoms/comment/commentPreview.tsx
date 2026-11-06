import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CommentRevisionFragment,
  CommentRevisionInput,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { toPlaintext } from '@wepublish/richtext';
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAttachFile,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdTag,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

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
      <Typography
        variant="h6"
        component="p"
      >
        <MdAttachFile />
        <span style={{ marginLeft: '5px' }}>
          {t('commentPreview.noContent')}
        </span>
      </Typography>
    );
  }
  return (
    <>
      {revision.title && (
        <Typography
          variant="h6"
          component="h4"
        >
          {revision.title}
        </Typography>
      )}

      {revision.lead && <Typography>{revision.lead}</Typography>}

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
      <Typography
        variant="h6"
        component="h4"
        style={{ marginBottom: '5px' }}
      >
        {t('tags.overview.title')}
      </Typography>
      {tags &&
        tags.map(tag => (
          <div key={tag.id}>
            <MdTag /> {tag.tag}
          </div>
        ))}
      {(!tags || !tags.length) && (
        <Typography>{t('commentPreview.noTags')}</Typography>
      )}
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
    <Typography
      variant="h6"
      component="h4"
      style={{ marginBottom: '5px' }}
    >
      {t('commentPreview.source')}
    </Typography>
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
  const panelId = useId();
  const commentLabelId = useId();

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
      sx={
        expanded ?
          {
            border: '1px solid',
            borderColor: 'text.primary',
            backgroundColor: 'background.default',
          }
        : {}
      }
    >
      <AccordionSummary
        id={`${panelId}-header`}
        aria-controls={`${panelId}-content`}
        expandIcon={<MdExpandMore />}
      >
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
              <Grid size={{ xs: 9 }}>
                <CommentRevisionView revision={lastRevision} />
              </Grid>
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
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="commentTitle"
                  label={t('commentEditView.title')}
                  value={revision?.title || ''}
                  placeholder={t('commentEditView.title')}
                  onChange={event => {
                    if (setRevision) {
                      const title = event.target.value;
                      setRevision(oldRevision => ({ ...oldRevision, title }));
                    }
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="commentLead"
                  label={t('commentEditView.lead')}
                  value={revision?.lead || ''}
                  placeholder={t('commentEditView.lead')}
                  onChange={event => {
                    if (setRevision) {
                      const lead = event.target.value;
                      setRevision(oldRevision => ({ ...oldRevision, lead }));
                    }
                  }}
                  fullWidth
                />
              </Grid>
              <Grid
                size={{ xs: 12 }}
                style={{ marginTop: '20px' }}
              >
                <FormLabel id={commentLabelId}>
                  {t('commentEditView.comment')}
                </FormLabel>

                <RichTextBlock
                  aria-labelledby={commentLabelId}
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
            <Button
              component={RouterLink}
              to={`/comments/edit/${comment.id}`}
              variant="outlined"
              startIcon={<MdEdit />}
              style={{ marginLeft: '10px' }}
            >
              {t('commentPreview.editComment')}
            </Button>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
