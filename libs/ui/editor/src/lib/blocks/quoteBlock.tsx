import styled from '@emotion/styled';
import { Drawer } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChooseEditImage } from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel, ImageSelectPanel } from '../panel';
import { QuoteBlockValue } from './types';

const Wrapper = styled('div')`
  container-type: inline-size;
`;

const ContentLayout = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 5fr);
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  @container (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const QuoteText = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const Author = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: baseline;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
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
    if (autofocus) {
      focusRef.current?.focus();
    }
  }, []);

  return (
    <Wrapper>
      <ContentLayout>
        <ChooseEditImage
          onSelect={image => {
            setChooseModalOpen(false);
            onChange(value => ({ ...value, image, imageID: image.id }));
          }}
          image={image}
          disabled={!!disabled}
          maxHeight={200}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => onChange(value => ({ ...value, image: null }))}
        />

        <QuoteText>
          <TypographicTextArea
            ref={focusRef}
            variant="h2"
            placeholder={t('blocks.quote.quote')}
            value={quote}
            disabled={disabled}
            onChange={e => {
              const quote = e.target.value;
              onChange(value => ({ ...value, quote }));
            }}
          />

          <Author>
            <span aria-hidden>—</span>
            <TypographicTextArea
              variant="body1"
              placeholder={t('blocks.quote.author')}
              value={author}
              disabled={disabled}
              onChange={e => {
                const author = e.target.value;
                onChange(value => ({ ...value, author }));
              }}
            />
          </Author>
        </QuoteText>
      </ContentLayout>

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
    </Wrapper>
  );
}
