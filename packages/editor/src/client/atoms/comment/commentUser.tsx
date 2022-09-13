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
    setComment(oldComment => ({...oldComment, user}))
  }

  function setGuestUser(guestUsername: string) {
    if (!comment) {
      return
    }
    setComment(oldComment => ({...oldComment, guestUsername}))
  }

  function setImage(guestUserImage: ImageRefFragment | undefined) {
    if (!comment) {
      return
    }
    setComment(oldComment => ({...oldComment, guestUserImage}))
  }

  return (
    <>
      <Row>
        <Col xs={24}>
          <Form.ControlLabel>{t('commentUser.selectExistingUser')}</Form.ControlLabel>
          <UserSearch
            name="selectFromExistingUser"
            placeholder={t('commentUser.selectExistingUser')}
            onUpdateUser={setUser}
            user={comment?.user}
          />
        </Col>
        <Col xs={24}>
          <Form.ControlLabel>{t('commentUser.guestUser')}</Form.ControlLabel>
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
            header={t('commentUser.selectImage')}
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
