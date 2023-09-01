import {css, styled} from '@mui/material'
import {BuilderImageUploadProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useId, useRef} from 'react'
import {MdDelete, MdEdit, MdOutlineUploadFile} from 'react-icons/md'
import {ReactComponent as PlaceholderImage} from './placeholder.svg'

export const ImageUploadWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: max-content 1fr;
  align-items: center;
`

export const ImageUploadImageWrapper = styled('div')`
  display: grid;
`

export const ImageUploadContent = styled('div')`
  display: grid;
  justify-content: flex-start;
`

const hiddenInputStyles = css`
  opacity: 0;
  visibility: none;
  width: 0;
  height: 0;
`

const avatarStyles = css`
  width: 150px;
  height: 150px;
  border-radius: 100%;
  overflow: hidden;
`

export function ImageUpload({image, onUpload, className}: BuilderImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    elements: {Image, IconButton}
  } = useWebsiteBuilder()

  return (
    <ImageUploadWrapper className={className}>
      <ImageUploadImageWrapper>
        {image ? (
          <Image css={avatarStyles} image={image} />
        ) : (
          <PlaceholderImage css={avatarStyles} />
        )}

        <input
          css={hiddenInputStyles}
          type="file"
          accept="image/*"
          onChange={onUpload}
          id={useId()}
          ref={fileInputRef}
        />
      </ImageUploadImageWrapper>

      <ImageUploadContent>
        {image ? (
          <>
            <IconButton color="error" onClick={() => onUpload(null)}>
              <MdDelete />
            </IconButton>

            <IconButton color="primary" onClick={() => fileInputRef.current?.click()}>
              <MdEdit />
            </IconButton>
          </>
        ) : (
          <IconButton color="primary" onClick={() => fileInputRef.current?.click()}>
            <MdOutlineUploadFile />
          </IconButton>
        )}
      </ImageUploadContent>
    </ImageUploadWrapper>
  )
}
