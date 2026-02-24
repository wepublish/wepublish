import {
  CommentRevision,
  CommentRevisionInput,
  FullCommentFragment,
} from '@wepublish/editor/api';
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
import { Col, FlexboxGrid, Form, Grid, IconButton, Panel, Row } from 'rsuite';

import { RichTextBlock } from '../../blocks/richTextBlock/rich-text-block';
import { RichTextBlockValue } from '../../blocks/types';
import { humanReadableCommentState } from './commentStateDropdown';
import { CreateCommentBtn } from './createCommentBtn';

export function CommentRevisionView({
  revision,
}: {
  revision: CommentRevision | undefined;
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
          <RichTextBlock
            value={revision.text}
            onChange={console.log}
            displayOnly
          />
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
    <Panel
      bordered
      collapsible
      header={
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>{getPanelHeader()}</FlexboxGrid.Item>
          <FlexboxGrid.Item>
            {panelExpanded && <MdExpandMore />}
            {!panelExpanded && <MdExpandLess />}
          </FlexboxGrid.Item>
        </FlexboxGrid>
      }
      defaultExpanded={!!expanded}
      onSelect={() => setPanelExpanded(!panelExpanded)}
      style={
        expanded ?
          { border: `1px solid black`, backgroundColor: '#f7f9fa' }
        : {}
      }
    >
      {!expanded && (
        <Grid style={{ maxWidth: '100%' }}>
          <Row style={{ maxWidth: '100%' }}>
            {/* title, lead, text */}
            <Col xs={18}>
              <CommentRevisionView revision={lastRevision} />
            </Col>
            {/* tags & source */}
            <Col xs={6}>
              <div>
                <CommentTags comment={displayComment} />
              </div>
              <div style={{ marginTop: '20px' }}>
                <CommentSource comment={displayComment} />
              </div>
            </Col>
          </Row>
        </Grid>
      )}
      {expanded && (
        <Grid style={{ maxWidth: '100%' }}>
          <Row>
            {/* comment title */}
            <Col xs={24}>
              <Form.ControlLabel>
                {t('commentEditView.title')}
              </Form.ControlLabel>
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
            </Col>
            {/* comment lead */}
            <Col xs={24}>
              <Form.ControlLabel>{t('commentEditView.lead')}</Form.ControlLabel>
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
            </Col>
            {/* comment text */}
            <Col
              xs={24}
              style={{ marginTop: '20px' }}
            >
              <Form.ControlLabel>
                {t('commentEditView.comment')}
              </Form.ControlLabel>

              <Panel
                bordered
                style={{ backgroundColor: 'white' }}
              >
                <RichTextBlock
                  value={revision?.text || []}
                  onChange={text => {
                    if (setRevision) {
                      setRevision(oldRevision => ({
                        ...oldRevision,
                        text: text as RichTextBlockValue['richText'],
                      }));
                    }
                  }}
                />
              </Panel>
            </Col>
          </Row>
        </Grid>
      )}

      {/* actions */}
      <Col
        xs={24}
        style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}
      >
        <CreateCommentBtn
          itemID={comment.itemID}
          itemType={comment.itemType}
          parentID={comment.id}
          appearance="ghost"
          text={t('replyCommentBtn.reply')}
        />
        {!expanded && (
          <Link to={`/comments/edit/${comment.id}`}>
            <IconButton
              style={{ marginLeft: '10px' }}
              icon={<MdEdit />}
              appearance="ghost"
            >
              {t('commentPreview.editComment')}
            </IconButton>
          </Link>
        )}
      </Col>
    </Panel>
  );
}
