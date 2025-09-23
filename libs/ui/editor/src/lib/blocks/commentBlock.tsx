import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Drawer, IconButton, Panel as RPanel } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { SelectCommentPanel } from '../panel/selectCommentsPanel';
import { CommentBlockValue } from './types';

const Panel = styled(RPanel)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();

  const isEmpty = !comments.length;

  useEffect(() => {
    if (autofocus && isEmpty) {
      setIsDialogOpen(true);
    }
  }, []);

  return (
    <>
      <Panel
        bodyFill
        bordered
      >
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {!isEmpty && (
            <Wrapper>
              <IconWrapper>
                <IconButton
                  size="lg"
                  icon={<MdEdit />}
                  onClick={() => setIsDialogOpen(true)}
                >
                  {t('blocks.comment.edit')}
                </IconButton>
              </IconWrapper>

              <p>
                {t('blocks.comment.comments', {
                  count:
                    comments.length ?
                      comments.length
                    : (filter.comments?.length ?? 0),
                })}
              </p>
            </Wrapper>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer
        size="lg"
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
