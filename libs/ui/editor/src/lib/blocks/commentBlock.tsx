import styled from '@emotion/styled';
import { Button, Card, CardContent, Drawer, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { DRAWER_WIDTHS } from '../drawer';
import { SelectCommentPanel } from '../panel/selectCommentsPanel';
import { CommentBlockValue } from './types';

const Panel = styled(Card)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`;

export const CommentBlock = ({
  itemId,
  value: { filter, comments },
  onChange,
  autofocus,
}: BlockProps<CommentBlockValue>) => {
  const { t } = useTranslation();

  const isEmpty = !comments.length;
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && isEmpty
  );

  return (
    <>
      <Panel variant="outlined">
        <CardContent>
          <CardContent>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <PlaceholderInput
                onAddClick={() => setIsDialogOpen(true)}
                addLabel={t('blocks.comment.chooseComments')}
              >
                {!isEmpty && (
                  <Wrapper>
                    <IconWrapper>
                      <Button
                        variant="outlined"
                        startIcon={<MdEdit />}
                        size="large"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        {t('blocks.comment.edit')}
                      </Button>
                    </IconWrapper>

                    <Typography>
                      {t('blocks.comment.comments', {
                        count:
                          comments.length ?
                            comments.length
                          : (filter.comments?.length ?? 0),
                      })}
                    </Typography>
                  </Wrapper>
                )}
              </PlaceholderInput>
            </CardContent>
          </CardContent>
        </CardContent>
      </Panel>

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
