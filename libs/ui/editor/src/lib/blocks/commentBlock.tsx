import { Drawer } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import { DRAWER_WIDTHS } from '../drawer';
import { SelectCommentPanel } from '../panel/selectCommentsPanel';
import { CommentBlockValue } from './types';

export const CommentBlock = ({
  itemId,
  value: { filter, comments },
  onChange,
  autofocus,
  disabled,
}: BlockProps<CommentBlockValue>) => {
  const { t } = useTranslation();

  const isEmpty = !comments.length;
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && isEmpty
  );

  return (
    <>
      <BlockPreviewCard
        isEmpty={isEmpty}
        emptyLabel={t('blocks.comment.chooseComments')}
        editLabel={t('blocks.comment.edit')}
        onEdit={() => setIsDialogOpen(true)}
        title={t('blocks.comment.comments', {
          count: comments.length || (filter.comments?.length ?? 0),
        })}
        disabled={disabled}
      />

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.lg,
              maxWidth: '100vw',
            },
          },
        }}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <SelectCommentPanel
          itemId={itemId}
          selectedFilter={filter}
          onClose={() => setIsDialogOpen(false)}
          onSelect={(newFilter, newComments) => {
            setIsDialogOpen(false);
            onChange({ filter: newFilter, comments: newComments });
          }}
        />
      </Drawer>
    </>
  );
};
