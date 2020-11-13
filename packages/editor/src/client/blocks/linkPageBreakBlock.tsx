import React, {useRef, useEffect, useState, useCallback} from 'react'

import {TypographicTextArea} from '../atoms/typographicTextArea'
import {BlockProps} from '../atoms/blockList'
import {LinkPageBreakBlockValue, RichTextBlockValue} from './types'
import {createDefaultValue, RichTextBlock} from './richTextBlock'
import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {isFunctionalUpdate} from '@karma.run/react'

import {useTranslation} from 'react-i18next'
import {LinkPageBreakEditPanel} from '../panel/linkPageBreakEditPanel'
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
      <Box position="relative" width="100%">
        <Box position="absolute" zIndex={ZIndex.Default} height="100%" right={0}>
          <IconButton
            icon={MaterialIconEditOutlined}
            onClick={() => setEditPanelOpen(true)}
            margin={Spacing.ExtraSmall}
          />
        </Box>
      </Box>
      <div style={{display: 'flex', flexFlow: 'row wrap'}}>
        <div style={{flex: '1 0 25%', alignSelf: 'center', marginBottom: '10px'}}>
          <Card overflow="hidden" width={'100%'} height={150} padding={0}>
            <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
              {image && (
                <Box position="relative" width="100%" height="100%">
                  <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                    <IconButton
                      icon={MaterialIconImageOutlined}
                      margin={Spacing.ExtraSmall}
                      onClick={() => setChooseModalOpen(true)}
                    />
                    <IconButton
                      icon={MaterialIconEditOutlined}
                      margin={Spacing.ExtraSmall}
                      onClick={() => setEditModalOpen(true)}
                    />
                    <IconButton
                      icon={MaterialIconClose}
                      margin={Spacing.ExtraSmall}
                      onClick={() => onChange(value => ({...value, image: undefined}))}
                    />
                  </Box>
                  {image.previewURL && <Image src={image.previewURL} width="100%" height="100%" />}
                </Box>
              )}
            </PlaceholderInput>
          </Card>
        </div>
        <div style={{flex: '1 0 70%'}}>
          <Box padding={Spacing.ExtraSmall} marginBottom={Spacing.ExtraSmall}>
            <Box>
              <TextInput
                ref={focusInputRef}
                placeholder={t('blocks.linkPageBreak.title')}
                label={t('blocks.linkPageBreak.title')}
                style={{fontSize: '24px'}}
                value={text}
                disabled={disabled}
                onChange={e => onChange({...value, text: e.target.value})}
              />
            </Box>
            <Box flexGrow={1}>
              <RichTextBlock
                value={richText || createDefaultValue()}
                onChange={handleRichTextChange}
              />
            </Box>
          </Box>
        </div>
      </div>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={image => {
              setChooseModalOpen(false)
              onChange(value => ({...value, image, imageID: image.id}))
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
      <Drawer open={isEditPanelOpen} width={480}>
        {() => (
          <LinkPageBreakEditPanel
            value={value}
            onClose={() => setEditPanelOpen(false)}
            onChange={onChange}
          />
        )}
      </Drawer>
    </>
  )
}
