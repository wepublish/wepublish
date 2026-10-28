import { css } from '@mui/material';
import styled from '@emotion/styled';
import { FullImageFragment } from '@wepublish/website/api';
import {
  BuilderImageUploadProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useId, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdEdit, MdOutlineUploadFile } from 'react-icons/md';
import { ImageUploadPlaceholder } from './image-upload-placeholder';

export const ImageUploadWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: max-content 1fr;
  align-items: center;
`;

export const ImageUploadImageWrapper = styled('div')`
  display: grid;
`;

export const ImageUploadContent = styled('div')`
  display: grid;
  justify-content: flex-start;
`;

const hiddenInputStyles = css`
  opacity: 0;
  visibility: none;
  width: 0;
  height: 0;
`;

const avatarStyles = css`
  width: 150px;
  height: 150px;
  border-radius: 100%;
  overflow: hidden;
`;

export const ImageUpload = forwardRef<
  HTMLInputElement | null,
  BuilderImageUploadProps
>(function ImageUpload({ image, onUpload, className }, parentRef) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    elements: { Image, IconButton },
  } = useWebsiteBuilder();
  const inputId = useId();
  const { t } = useTranslation();

  useImperativeHandle(parentRef, () => fileInputRef.current!, []);

  return (
    <ImageUploadWrapper className={className}>
      <ImageUploadImageWrapper>
        {image ?
          <Image
            css={avatarStyles}
            image={image as unknown as FullImageFragment}
          />
        : <ImageUploadPlaceholder css={avatarStyles} />}

        <input
          css={hiddenInputStyles}
          type="file"
          accept="image/*"
          onChange={onUpload}
          ref={fileInputRef}
          id={inputId}
        />
      </ImageUploadImageWrapper>

      <ImageUploadContent>
        {image ?
          <>
            <IconButton
              color="error"
              onClick={() => onUpload(null)}
              title={t('user.imageUpload.delete')}
            >
              <MdDelete />
            </IconButton>

            <IconButton
              color="primary"
              onClick={() => fileInputRef.current?.click()}
              title={t('user.imageUpload.replace')}
            >
              <MdEdit />
            </IconButton>
          </>
        : <IconButton
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            title={t('user.imageUpload.upload')}
          >
            <MdOutlineUploadFile />
          </IconButton>
        }
      </ImageUploadContent>
    </ImageUploadWrapper>
  );
});
