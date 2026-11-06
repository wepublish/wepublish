import { Drawer, FormLabel, Grid, TextField } from '@mui/material';
import { FullCommentFragment, FullImageFragment } from '@wepublish/editor/api';
import { Dispatch, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DRAWER_WIDTHS } from '../../drawer';
import { ImageSelectPanel } from '../../panel/imageSelectPanel';
import { ChooseEditImage } from '../chooseEditImage';
import { UserSearch } from '../searchAndFilter/userSearch';

interface CommentUserProps {
  comment?: FullCommentFragment;
  setComment: Dispatch<SetStateAction<FullCommentFragment | undefined>>;
}

export function CommentUser({ comment, setComment }: CommentUserProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const userLabelId = useId();
  const imageLabelId = useId();

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
          <FormLabel id={userLabelId}>
            {t('commentUser.selectExistingUser')}
          </FormLabel>

          <UserSearch
            aria-labelledby={userLabelId}
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
          <TextField
            name="guestUser"
            label={t('commentUser.guestUser')}
            placeholder={t('commentUser.guestUser')}
            onChange={event => setGuestUser(event.target.value)}
            value={comment?.guestUsername || ''}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 9 }}>
          <FormLabel id={imageLabelId}>
            {t('commentUser.selectImage')}
          </FormLabel>

          <ChooseEditImage
            aria-labelledby={imageLabelId}
            onSelect={(image: FullImageFragment) => {
              setImage(image);
              setOpen(false);
            }}
            image={comment?.guestUserImage}
            disabled={false}
            openChooseModalOpen={() => setOpen(true)}
            removeImage={() => setImage(undefined)}
          />
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
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
