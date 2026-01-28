import styled from '@emotion/styled';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Drawer, IconButton, Input as RInput } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { LinkPageBreakEditPanel } from '../panel/linkPageBreakEditPanel';
import { isFunctionalUpdate } from '../utility';
import {
  createDefaultValue,
  RichTextBlock,
} from './richTextBlock/rich-text-block';
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
          <IconButton
            size="lg"
            icon={<MdEdit />}
            onClick={() => setEditPanelOpen(true)}
          />
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
            minHeight={150}
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
            value={richText || createDefaultValue()}
            onChange={handleRichTextChange}
          />
        </InputWrapper>
      </ContentWrapper>
      <Drawer
        open={isChooseModalOpen}
        size="sm"
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
          open={isEditModalOpen}
          size="sm"
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
        open={isEditPanelOpen}
        size="sm"
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
