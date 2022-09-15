import {Attachment} from '@rsuite/icons'
import React from 'react'
import {useTranslation} from 'react-i18next'
import {Col, Grid, Panel, Row} from 'rsuite'

import {FullCommentFragment} from '../../api'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'

interface CommentPreviewProps {
  comment: FullCommentFragment
  expanded?: boolean
}

export function CommentPreview({comment, expanded}: CommentPreviewProps) {
  const {t} = useTranslation()
  const revisions = comment.revisions
  const lastRevision = revisions?.length ? revisions[revisions.length - 1] : undefined

  function getPanelText() {
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
    <Panel shaded collapsible header={getPanelText()} defaultExpanded={!!expanded}>
      <Grid>
        <Row>
          {/* title, lead, text */}
          <Col xs={18}>
            {lastRevision && (
              <>
                {lastRevision.title && <h6>{lastRevision.title}</h6>}

                {lastRevision.lead && <p>{lastRevision.lead}</p>}

                {lastRevision.text && (
                  <div style={{marginTop: '5px'}}>
                    <RichTextBlock value={lastRevision.text} onChange={console.log} displayOnly />
                  </div>
                )}
              </>
            )}

            {!lastRevision && (
              <h6>
                <Attachment />
                <span style={{marginLeft: '5px'}}>{t('commentPreview.noContent')}</span>
              </h6>
            )}
          </Col>
        </Row>
      </Grid>
    </Panel>
  )
}
