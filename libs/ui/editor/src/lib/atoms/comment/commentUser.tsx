import { Drawer, Grid } from '@mui/material';
import { FullCommentFragment, FullImageFragment } from '@wepublish/editor/api';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'rsuite';

import { DRAWER_WIDTHS } from '../../drawer';
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
      oldComment ?
        { ...oldComment, guestUserImage: guestUserImage ?? null }
      : oldComment
    );
  }

  return (
    <>
      <Grid
        container
        spacing={2}
      >
        <Grid size={{ xs: 12 }}>
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
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Form.Label>{t('commentUser.guestUser')}</Form.Label>
          <Form.Control
            name="guestUser"
            placeholder={t('commentUser.guestUser')}
            onChange={setGuestUser}
            value={comment?.guestUsername || ''}
          />
        </Grid>

        <Grid size={{ xs: 9 }}>
          <ChooseEditImage
            image={comment?.guestUserImage}
            disabled={false}
            openChooseModalOpen={() => setOpen(true)}
            removeImage={() => setImage(undefined)}
            header={t('commentUser.selectImage')}
          />
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
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
