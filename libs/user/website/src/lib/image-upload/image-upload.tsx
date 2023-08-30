import {ChangeEvent, useId, useRef} from 'react'
import {MdDelete, MdEdit} from 'react-icons/md'
import {IconButton, styled} from '@mui/material'
import placeholderImg from './placeholder.svg'

export type ImageUploadProps = {
  image?: {url?: string | null | undefined}
  onUpload: (image: ChangeEvent<HTMLInputElement> | null) => void
  className?: string
}

export const ImageWrapper = styled('div')`
  display: grid;
`

export const ContentWrapper = styled('div')`
  display: grid;
  justify-content: flex-start;
`

const Avatar = styled('img')`
  width: 150px;
  height: 150px;
  border-radius: 100%;
`

const Wrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 150px 1fr;
  align-items: center;

  input {
    opacity: 0;
    visibility: none;
    width: 1px;
    height: 1px;
  }
`

const ActionButton = styled(IconButton)`
  margin-left: 10px;
`

export function ImageUpload({image, onUpload, className}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Wrapper className={className}>
      <ImageWrapper>
        <Avatar src={image?.url || placeholderImg} alt="user-avatar" />
        <input type="file" accept="image/*" onChange={onUpload} id={useId()} ref={fileInputRef} />
      </ImageWrapper>
      <ContentWrapper>
        <ActionButton color="error" onClick={() => onUpload(null)}>
          <MdDelete />
        </ActionButton>
        <ActionButton color="primary" onClick={() => fileInputRef.current!.click()}>
          <MdEdit />
        </ActionButton>
      </ContentWrapper>
    </Wrapper>
  )
}
