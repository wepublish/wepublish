import React from 'react'
import {useTranslation} from 'react-i18next'
import {Col, Form, Row} from 'rsuite'

import {FullCommentFragment, FullUserFragment} from '../../api'
import {UserSearch} from '../searchAndFilter/userSearch'

interface CommentUserProps {
  comment?: FullCommentFragment
  setComment(comment: FullCommentFragment): void
}

export function CommentUser({comment, setComment}: CommentUserProps) {
  const {t} = useTranslation()

  function setUser(user: FullUserFragment) {
    if (!comment) {
      return
    }
    const newComment = {...comment}
    newComment.user = user
    setComment(newComment)
  }

  function setGuestUser(userName: string) {
    if (!comment) {
      return
    }
    const newComment = {...comment}
    newComment.guestUsername = userName
    setComment(newComment)
  }

  return (
    <Row>
      <Col xs={12}>
        <Form.ControlLabel>{t('commentEditView.existingUserLabel')}</Form.ControlLabel>
        <UserSearch
          name="selectFromExistingUser"
          placeholder={t('commentUser.selectFromExistingUser')}
          onUpdateUser={setUser}
          user={comment?.user}
        />
      </Col>
      <Col xs={12}>
        <Form.ControlLabel>{t('commentEditView.guestUserLabel')}</Form.ControlLabel>
        <Form.Control
          name="guestUser"
          placeholder={t('commentUser.guestUser')}
          onChange={setGuestUser}
          value={comment?.guestUsername || ''}
        />
      </Col>
    </Row>
  )
}
