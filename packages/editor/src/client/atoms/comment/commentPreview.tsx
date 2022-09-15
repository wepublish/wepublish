import {Attachment} from '@rsuite/icons'
import EyeIcon from '@rsuite/icons/legacy/Eye'
import TagIcon from '@rsuite/icons/Tag'
import React from 'react'
import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {Col, Grid, IconButton, Panel, Row} from 'rsuite'

import {CommentRevision, FullCommentFragment} from '../../api'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {ReplyCommentBtn} from './replyCommentBtn'

export function CommentRevisionView({revision}: {revision: CommentRevision | undefined}) {
  const {t} = useTranslation()
  if (!revision) {
    return (
      <h6>
        <Attachment />
        <span style={{marginLeft: '5px'}}>{t('commentPreview.noContent')}</span>
      </h6>
    )
  }
  return (
    <>
      {revision.title && <h6>{revision.title}</h6>}

      {revision.lead && <p>{revision.lead}</p>}

      {revision.text && (
        <div style={{marginTop: '5px'}}>
          <RichTextBlock value={revision.text} onChange={console.log} displayOnly />
        </div>
      )}
    </>
  )
}

function CommentTags({comment}: {comment: FullCommentFragment | undefined}) {
  const {t} = useTranslation()
  const tags = comment?.tags
  return (
    <>
      <h6 style={{marginBottom: '5px'}}>{t('tags.overview.title')}</h6>
      {tags &&
        tags.map(tag => (
          <div key={tag.id}>
            <TagIcon /> {tag.tag}
          </div>
        ))}
      {(!tags || !tags.length) && <p>{t('commentPreview.noTags')}</p>}
    </>
  )
}

function CommentSource({comment}: {comment: FullCommentFragment | undefined}) {
  const {t} = useTranslation()
  const source = comment?.source
  const title = <h6 style={{marginBottom: '5px'}}>{t('commentPreview.source')}</h6>

  if (source) {
    return (
      <>
        {title}
        {source}
      </>
    )
  }
  return (
    <>
      {title}
      {t('commentPreview.noSource')}
    </>
  )
}

interface CommentPreviewProps {
  comment: FullCommentFragment
  expanded?: boolean
}

export function CommentPreview({comment, expanded}: CommentPreviewProps) {
  const {t} = useTranslation()
  const revisions = comment.revisions
  const lastRevision = revisions?.length ? revisions[revisions.length - 1] : undefined

  function getPanelHeader() {
    const createdAtReadable = new Date(comment.createdAt).toLocaleString('de-CH', {
      timeZone: 'europe/zurich'
    })

    if (comment.guestUsername) {
      return `${comment.guestUsername} (${t('commentHistory.guestUser')}) | ${createdAtReadable}`
    }

    const user = comment.user
    let userName
    if (!user) {
      userName = t('commentHistory.unknownUser')
    } else {
      userName = user?.firstName ? `${user.firstName} ${user.name}` : user.name
    }

    return `${userName} | ${createdAtReadable}`
  }

  return (
    <Panel bordered collapsible header={getPanelHeader()} defaultExpanded={!!expanded}>
      <Grid style={{maxWidth: '100%'}}>
        <Row style={{maxWidth: '100%'}}>
          {/* title, lead, text */}
          <Col xs={18}>
            <CommentRevisionView revision={lastRevision} />
          </Col>
          {/* tags & source */}
          <Col xs={6}>
            <div>
              <CommentTags comment={comment} />
            </div>
            <div style={{marginTop: '20px'}}>
              <CommentSource comment={comment} />
            </div>
          </Col>
          {/* actions */}
          <Col xs={24} style={{textAlign: 'center', marginTop: '20px'}}>
            <ReplyCommentBtn comment={comment} appearance="ghost" />
            <Link to={`/comments/edit/${comment.id}`}>
              <IconButton style={{marginLeft: '10px'}} icon={<EyeIcon />} appearance="ghost">
                {t('commentPreview.showComment')}
              </IconButton>
            </Link>
          </Col>
        </Row>
      </Grid>
    </Panel>
  )
}
