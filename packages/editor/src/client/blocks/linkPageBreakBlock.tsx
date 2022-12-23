import styled from '@emotion/styled'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Drawer, IconButton, Input} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ImageEditPanel} from '../panel/imageEditPanel'
import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {LinkPageBreakEditPanel} from '../panel/linkPageBreakEditPanel'
import {isFunctionalUpdate} from '../utility'
import {createDefaultValue, RichTextBlock} from './richTextBlock/richTextBlock'
import {LinkPageBreakBlockValue, RichTextBlockValue} from './types'

const StyledInput = styled(Input)`
  font-size: 24px;
  margin-bottom: 20;
`

const StyledInputWrapper = styled.div`
  flex: 1 0 70%;
`

const StyledChooseImageWrapper = styled.div`
  flex: 1 0 25%;
  align-self: center;
  margin-bottom: 10px;
`

const StyledContentWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin-top: 50;
`

const StyledIconWrapper = styled.div`
  position: absolute;
  z-index: 1;
  height: 100%;
  right: 0;
`

const StyledLinkPage = styled.div`
  position: relative;
  width: 100%;
`

export type LinkPageBreakBlockProps = BlockProps<LinkPageBreakBlockValue>

export function LinkPageBreakBlock({
  value,
  onChange,
  autofocus,
  disabled
}: LinkPageBreakBlockProps) {
  const {text, richText, image} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const focusInputRef = useRef<HTMLInputElement>(null)

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        richText: isFunctionalUpdate(richText) ? richText(value.richText) : richText
      })),
    [onChange]
  )

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isEditPanelOpen, setEditPanelOpen] = useState(false)

  return (
    <>
      <StyledLinkPage>
        <StyledIconWrapper>
          <IconButton size="lg" icon={<MdEdit />} onClick={() => setEditPanelOpen(true)} />
        </StyledIconWrapper>
      </StyledLinkPage>
      <StyledContentWrapper>
        <StyledChooseImageWrapper>
          <ChooseEditImage
            header={''}
            image={image}
            disabled={false}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => onChange(value => ({...value, image: undefined}))}
          />
        </StyledChooseImageWrapper>
        <StyledInputWrapper>
          <StyledInput
            ref={focusInputRef}
            placeholder={t('blocks.linkPageBreak.title')}
            value={text}
            disabled={disabled}
            onChange={text => onChange({...value, text})}
          />

          <RichTextBlock value={richText || createDefaultValue()} onChange={handleRichTextChange} />
        </StyledInputWrapper>
      </StyledContentWrapper>
      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            onChange(value => ({...value, image, imageID: image.id}))
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
      <Drawer open={isEditPanelOpen} size="sm" onClose={() => setEditPanelOpen(false)}>
        <LinkPageBreakEditPanel
          value={value}
          onClose={() => setEditPanelOpen(false)}
          onChange={onChange}
        />
      </Drawer>
    </>
  )
}
