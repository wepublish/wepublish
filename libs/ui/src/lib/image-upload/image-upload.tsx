import styled from '@emotion/styled'
import {FullImageFragment} from '@wepublish/website/api'
import {useRef} from 'react'
import {MdDelete, MdEdit} from 'react-icons/md'
import {IconButton} from '../icon-button/icon-button'

export type ImageUploadProps = {
  image?: FullImageFragment | null
  onUpload: (image: any) => void
}

const Avatar = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 150px;
`

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const ActionButton = styled(IconButton)`
  margin-left: 10px;
`

export function ImageUpload({image, onUpload}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Wrapper>
      <Avatar src={image?.mediumURL || 'https://unsplash.it/300/200'} alt="user-avatar" />
      <input
        type="file"
        accept="image/*"
        onChange={onUpload}
        style={{display: 'none'}}
        id="image-upload-input"
        ref={fileInputRef}
      />
      <ActionButton color="error" onClick={() => onUpload(null)}>
        <MdDelete />
      </ActionButton>
      <ActionButton color="primary" onClick={() => fileInputRef.current!.click()}>
        <MdEdit />
      </ActionButton>
    </Wrapper>
  )
}
