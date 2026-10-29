import styled from '@emotion/styled';
import { Button, Drawer, Typography } from '@mui/material';
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { LinkPageBreakEditPanel } from '../panel/linkPageBreakEditPanel';
import { isFunctionalUpdate } from '../utility';
import { RichTextBlock } from './richTextBlock/rich-text-block';
import { LinkPageBreakBlockValue, RichTextBlockValue } from './types';

const Wrapper = styled('div')`
  container-type: inline-size;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
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

const LinkSummary = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
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

  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus) {
      focusRef.current?.focus();
    }
  }, []);

  const handleRichTextChange = useCallback(
    (richText: SetStateAction<RichTextBlockValue['richText']>) =>
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
    <Wrapper>
      <TypographicTextArea
        ref={focusRef}
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={text ?? ''}
        disabled={disabled}
        onChange={event => {
          const text = event.target.value;
          onChange(value => ({ ...value, text }));
        }}
      />

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
          removeImage={() =>
            onChange(value => ({ ...value, image: undefined }))
          }
        />

        <RichTextBlock
          value={richText}
          disabled={disabled}
          onChange={handleRichTextChange}
        />
      </ContentLayout>

      <LinkSummary>
        <Button
          variant="text"
          startIcon={<MdEdit />}
          disabled={disabled}
          onClick={() => setEditPanelOpen(true)}
        >
          {t('blocks.linkPageBreak.editSettings')}
        </Button>

        {!value.hideButton && (value.linkText || value.linkURL) && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {[value.linkText, value.linkURL].filter(Boolean).join(' → ')}
          </Typography>
        )}
      </LinkSummary>

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
        open={isEditPanelOpen}
        onClose={() => setEditPanelOpen(false)}
      >
        <LinkPageBreakEditPanel
          value={value}
          onClose={() => setEditPanelOpen(false)}
          onChange={onChange}
        />
      </Drawer>
    </Wrapper>
  );
}
