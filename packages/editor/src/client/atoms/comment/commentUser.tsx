import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Col, Drawer, Form, Row} from 'rsuite'

import {FullCommentFragment, FullUserFragment, ImageRefFragment} from '../../api'
import {ImageSelectPanel} from '../../panel/imageSelectPanel'
import {ChooseEditImage} from '../chooseEditImage'
import {UserSearch} from '../searchAndFilter/userSearch'

interface CommentUserProps {
  comment?: FullCommentFragment
  setComment(comment: FullCommentFragment): void
}

export function CommentUser({comment, setComment}: CommentUserProps) {
  const {t} = useTranslation()
  const [open, setOpen] = useState<boolean>(false)

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

  function setImage(image: ImageRefFragment | undefined) {
    if (!comment) {
      return
    }
    const newComment = {...comment}
    newComment.guestUserImage = image
    setComment(newComment)
  }

  return (
    <>
      <Row>
        <Col xs={24}>
          <Form.ControlLabel>{t('commentEditView.existingUserLabel')}</Form.ControlLabel>
          <UserSearch
            name="selectFromExistingUser"
            placeholder={t('commentUser.selectFromExistingUser')}
            onUpdateUser={setUser}
            user={comment?.user}
          />
        </Col>
        <Col xs={24}>
          <Form.ControlLabel>{t('commentEditView.guestUserLabel')}</Form.ControlLabel>
          <Form.Control
            name="guestUser"
            placeholder={t('commentUser.guestUser')}
            onChange={setGuestUser}
            value={comment?.guestUsername || ''}
          />
        </Col>
        <Col xs={18}>
          <ChooseEditImage
            image={comment?.guestUserImage}
            disabled={false}
            openChooseModalOpen={() => setOpen(true)}
            removeImage={() => setImage(undefined)}
            header={t('commentUser.selectGuestUserImage')}
          />
        </Col>
      </Row>
      <Drawer
        open={open}
        onClose={() => {
          setOpen(false)
        }}>
        <ImageSelectPanel
          onClose={() => setOpen(false)}
          onSelect={(image: ImageRefFragment) => {
            setImage(image)
            setOpen(false)
          }}
        />
      </Drawer>
    </>
  )
}
