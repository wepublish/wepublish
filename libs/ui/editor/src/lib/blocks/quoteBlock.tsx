import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'rsuite';

import { ChooseEditImage } from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { ImageEditPanel, ImageSelectPanel } from '../panel';
import { QuoteBlockValue } from './types';

const ChooseImageWrapper = styled.div`
  flex: 1 0 25%;
  align-self: flex-start;
  margin-bottom: 10px;
`;

const Dash = styled.div`
  margin-right: 5px;
`;

const QuoteTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  padding: 2rem 0;
  gap: 24px;
`;

const InputWrapper = styled.div`
  flex: 1 0 70%;
`;

export type QuoteBlockProps = BlockProps<QuoteBlockValue>;

export function QuoteBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: QuoteBlockProps) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { quote, author, image } = value;
  const focusRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus) focusRef.current?.focus();
  }, []);

  return (
    <ContentWrapper>
      <ChooseImageWrapper>
        <ChooseEditImage
          header={''}
          image={image}
          disabled={false}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => onChange?.({ ...value, image: null })}
        />
      </ChooseImageWrapper>
      <InputWrapper>
        <TypographicTextArea
          ref={focusRef}
          variant="h1"
          placeholder={t('blocks.quote.quote')}
          value={quote}
          disabled={disabled}
          onChange={e => onChange({ ...value, quote: e.target.value })}
        />
        <QuoteTextWrapper>
          <Dash>—</Dash>
          <TypographicTextArea
            variant="body1"
            placeholder={t('blocks.quote.author')}
            value={author}
            disabled={disabled}
            onChange={e => onChange({ ...value, author: e.target.value })}
          />
        </QuoteTextWrapper>
      </InputWrapper>
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
    </ContentWrapper>
  );
}
