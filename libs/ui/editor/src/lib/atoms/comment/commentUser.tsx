import { FullCommentFragment, FullImageFragment } from '@wepublish/editor/api';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Col, Drawer, Form, Row } from 'rsuite';

import { ImageSelectPanel } from '../../panel/imageSelectPanel';
import { ChooseEditImage } from '../chooseEditImage';
import { UserSearch } from '../searchAndFilter/userSearch';

interface CommentUserProps {
  comment?: FullCommentFragment;
  setComment: React.Dispatch<
    React.SetStateAction<FullCommentFragment | undefined>
  >;
}

export function CommentUser({ comment, setComment }: CommentUserProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function setUser(user: FullCommentFragment['user']) {
    setComment(oldComment =>
      oldComment ?
        {
          ...oldComment,
          user,
        }
      : oldComment
    );
  }

  function setGuestUser(guestUsername: string) {
    setComment(oldComment =>
      oldComment ? { ...oldComment, guestUsername } : oldComment
    );
  }

  function setImage(guestUserImage: FullImageFragment | undefined) {
    setComment(oldComment =>
      oldComment ? { ...oldComment, guestUserImage } : oldComment
    );
  }

  return (
    <>
      <Row>
        <Col xs={24}>
          <Form.Label>{t('commentUser.selectExistingUser')}</Form.Label>

          <UserSearch
            key={`user-${comment?.user}`}
            name="selectFromExistingUser"
            placeholder={t('commentUser.selectExistingUser')}
            // @ts-expect-error test
            onUpdateUser={setUser}
            // @ts-expect-error test
            user={comment?.user}
          />
        </Col>

        <Col xs={24}>
          <Form.Label>{t('commentUser.guestUser')}</Form.Label>
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
            minHeight={150}
          />
        </Col>
      </Row>

      <Drawer
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setImage(image);
            setOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
