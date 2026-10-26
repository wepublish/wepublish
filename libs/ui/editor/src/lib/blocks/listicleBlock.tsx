import styled from '@emotion/styled';
import { Drawer } from '@mui/material';
import { SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { FieldProps, ListInput } from '../atoms/listInput';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { isFunctionalUpdate } from '../utility';
import { RichTextBlock } from './richTextBlock/rich-text-block';
import { ListicleBlockValue, ListicleItem, RichTextBlockValue } from './types';

const ListicleItemContainer = styled('div')`
  container-type: inline-size;
`;

const ListicleItemLayout = styled('div')`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  @container (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ListicleContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

export function ListicleBlock({
  value,
  onChange,
  disabled,
}: BlockProps<ListicleBlockValue>) {
  return (
    <ListInput
      value={value.items}
      onChange={items =>
        onChange(value => ({
          items: isFunctionalUpdate(items) ? items(value.items) : items,
        }))
      }
      defaultValue={{ image: null, richText: undefined, title: '' }}
      disabled={disabled}
    >
      {props => (
        <ListicleItemElement
          {...props}
          disabled={disabled}
        />
      )}
    </ListInput>
  );
}

export function ListicleItemElement({
  value,
  onChange,
  disabled,
}: FieldProps<ListicleItem> & { disabled?: boolean }) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const { image, title, richText } = value;

  const { t } = useTranslation();

  const handleRichTextChange = useCallback(
    (richText: SetStateAction<RichTextBlockValue['richText']>) =>
      onChange(value => ({
        ...value,
        richText:
          isFunctionalUpdate(richText) ? richText(value.richText) : richText,
      })),
    [onChange]
  );

  return (
    <>
      <ListicleItemContainer>
        <ListicleItemLayout>
          <ChooseEditImage
            onSelect={image => {
              setChooseModalOpen(false);
              onChange(value => ({ ...value, image }));
            }}
            image={image}
            disabled={!!disabled}
            maxHeight={150}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => onChange(value => ({ ...value, image: null }))}
          />

          <ListicleContent>
            <TypographicTextArea
              variant="h3"
              placeholder={t('blocks.listicle.title')}
              value={title ?? ''}
              disabled={disabled}
              onChange={e => {
                const title = e.target.value;
                onChange(value => ({ ...value, title }));
              }}
            />

            <RichTextBlock
              value={richText}
              disabled={disabled}
              onChange={handleRichTextChange}
            />
          </ListicleContent>
        </ListicleItemLayout>
      </ListicleItemContainer>

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
            onChange(value => ({ ...value, image }));
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
    </>
  );
}
