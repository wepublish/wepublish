import styled from '@emotion/styled';
import { Drawer, IconButton } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Input as RInput } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { LinkPageBreakEditPanel } from '../panel/linkPageBreakEditPanel';
import { isFunctionalUpdate } from '../utility';
import { RichTextBlock } from './richTextBlock/rich-text-block';
import { LinkPageBreakBlockValue, RichTextBlockValue } from './types';

const Input = styled(RInput)`
  font-size: 24px;
  margin-bottom: 20px;
`;

const InputWrapper = styled.div`
  flex: 1 0 70%;
`;

const ChooseImageWrapper = styled.div`
  flex: 1 0 25%;
  align-self: flex-start;
  margin-bottom: 10px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin-top: 50px;
  gap: 24px;
`;

const IconWrapper = styled.div`
  position: absolute;
  z-index: 1;
  height: 100%;
  right: 0;
`;

const LinkPage = styled.div`
  position: relative;
  width: 100%;
`;

export type LinkPageBreakBlockProps = BlockProps<LinkPageBreakBlockValue>;

export function LinkPageBreakBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: LinkPageBreakBlockProps) {
  const { text, richText, image } = value;
  const focusRef = useRef<HTMLTextAreaElement>(null);
  const focusInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus) focusRef.current?.focus();
  }, []);

  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue['richText']>) =>
      onChange(value => ({
        ...value,
        richText:
          isFunctionalUpdate(richText) ? richText(value.richText) : richText,
      })),
    [onChange]
  );

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isEditPanelOpen, setEditPanelOpen] = useState(false);

  return (
    <>
      <LinkPage>
        <IconWrapper>
          <IconButtonTooltip caption={t('blocks.linkPageBreak.editSettings')}>
            <IconButton
              size="large"
              aria-label={t('blocks.linkPageBreak.editSettings')}
              onClick={() => setEditPanelOpen(true)}
            >
              <MdEdit />
            </IconButton>
          </IconButtonTooltip>
        </IconWrapper>
      </LinkPage>
      <ContentWrapper>
        <ChooseImageWrapper>
          <ChooseEditImage
            header={''}
            image={image}
            disabled={false}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() =>
              onChange(value => ({ ...value, image: undefined }))
            }
          />
        </ChooseImageWrapper>

        <InputWrapper>
          <Input
            ref={focusInputRef}
            placeholder={t('blocks.linkPageBreak.title')}
            value={text}
            disabled={disabled}
            onChange={text => onChange({ ...value, text })}
          />

          <RichTextBlock
            value={richText}
            onChange={handleRichTextChange}
          />
        </InputWrapper>
      </ContentWrapper>

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
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false);
            onChange(value => ({ ...value, image, imageID: image.id }));
          }}
        />
      </Drawer>
      {image && (
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
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
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
        open={isEditPanelOpen}
        onClose={() => setEditPanelOpen(false)}
      >
        <LinkPageBreakEditPanel
          value={value}
          onClose={() => setEditPanelOpen(false)}
          onChange={onChange}
        />
      </Drawer>
    </>
  );
}
