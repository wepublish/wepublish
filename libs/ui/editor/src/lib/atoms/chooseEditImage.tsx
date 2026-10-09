import styled from '@emotion/styled';
import {
  Card as MuiCard,
  CardContent,
  CardHeader,
  IconButton,
} from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import React, { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdEdit, MdPhoto } from 'react-icons/md';
import { Dropdown, Placeholder } from 'rsuite';

import { PlaceholderInput } from './placeholderInput';

export interface ChooseEditImageProps {
  image?: FullImageFragment | null;
  header?: string;
  disabled: boolean;
  left?: number;
  top?: number;
  openChooseModalOpen?: () => void;
  openEditModalOpen?: () => void;
  removeImage?: () => void;
  maxHeight?: number;
  minHeight?: number;
}

const ImageWrapper = styled.div<{ maxHeight: number }>`
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  max-height: ${({ maxHeight }) => `${maxHeight}px`};
`;

const Image = styled.img`
  object-fit: contain;
  object-position: top left;
  width: 100%;
  height: 100%;
`;

const DropdownWrapper = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${({ top }) => top};
  left: ${({ left }) => left};
`;

const Panel = styled(MuiCard)`
  display: grid;
  overflow: visible;
`;

export function ChooseEditImage({
  image,
  header,
  disabled,
  left = 5,
  top = 5,
  openChooseModalOpen,
  openEditModalOpen,
  removeImage,
  maxHeight = 240,
  minHeight,
}: ChooseEditImageProps): JSX.Element {
  const { t } = useTranslation();
  header = header ?? t('chooseEditImage.header');
  return (
    <Panel>
      <CardContent>
        <CardContent>
          <CardHeader title={header} />

          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {!image && disabled === true && <Placeholder.Graph />}
            <PlaceholderInput
              onAddClick={() => openChooseModalOpen?.()}
              addLabel={t('chooseEditImage.chooseImage')}
              maxHeight={maxHeight}
            >
              {image && (
                <ImageWrapper maxHeight={maxHeight}>
                  <Image
                    src={image?.largeURL ?? '/static/placeholder-240x240.png'}
                  />

                  {(openChooseModalOpen ||
                    openEditModalOpen ||
                    removeImage) && (
                    <DropdownWrapper
                      top={top}
                      left={left}
                    >
                      <Dropdown
                        renderToggle={(
                          props: object,
                          ref: React.Ref<HTMLButtonElement>
                        ) => (
                          <IconButton
                            {...props}
                            ref={ref}
                            size="small"
                            title={t('chooseEditImage.imageOptions')}
                            aria-label={t('chooseEditImage.imageOptions')}
                          >
                            <MdEdit />
                          </IconButton>
                        )}
                      >
                        {openChooseModalOpen && (
                          <Dropdown.Item
                            disabled={disabled}
                            onClick={() => openChooseModalOpen()}
                          >
                            <MdPhoto /> {t('chooseEditImage.chooseImage')}
                          </Dropdown.Item>
                        )}
                        {openEditModalOpen && (
                          <Dropdown.Item
                            disabled={disabled}
                            onClick={() => openEditModalOpen()}
                          >
                            <MdEdit /> {t('chooseEditImage.editImage')}
                          </Dropdown.Item>
                        )}
                        {removeImage && (
                          <Dropdown.Item
                            disabled={disabled}
                            onClick={() => removeImage()}
                          >
                            <MdClose /> {t('chooseEditImage.removeImage')}
                          </Dropdown.Item>
                        )}
                      </Dropdown>
                    </DropdownWrapper>
                  )}
                </ImageWrapper>
              )}
            </PlaceholderInput>
          </CardContent>
        </CardContent>
      </CardContent>
    </Panel>
  );
}
