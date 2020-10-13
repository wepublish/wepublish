import React, {useRef, useEffect, useState, useCallback} from 'react'

import {
  BlockProps,
  Box,
  TextInput,
  Radio,
  RadioGroup,
  Card,
  Spacing,
  PlaceholderInput,
  ZIndex,
  IconButton,
  Image,
  Drawer,
  Toggle
} from '@karma.run/ui'
import {LinkPageBreakBlockValue, RichTextBlockValue} from './types'
import {
  MaterialIconClose,
  MaterialIconEditOutlined,
  MaterialIconImageOutlined
} from '@karma.run/icons'
import {createDefaultValue, RichTextBlock} from './richTextBlock'
import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {isFunctionalUpdate} from '@karma.run/react'

export type LinkPageBreakBlockProps = BlockProps<LinkPageBreakBlockValue>

export function LinkPageBreakBlock({
  value,
  onChange,
  autofocus,
  disabled
}: LinkPageBreakBlockProps) {
  const {
    text,
    linkText,
    linkURL,
    styleOption,
    layoutOption,
    richText,
    linkTarget,
    hideButton,
    image
  } = value
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const focusInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <>
      <Box flexGrow={1} style={{marginBottom: '20px'}}>
        <TextInput
          ref={focusInputRef}
          placeholder="Title"
          label="Title"
          style={{fontSize: '24px'}}
          value={text}
          disabled={disabled}
          onChange={e => onChange({...value, text: e.target.value})}
        />
      </Box>
      <Box flexGrow={1}>
        <RichTextBlock value={richText || createDefaultValue()} onChange={handleRichTextChange} />
      </Box>
      <Box style={{width: '50%', display: 'inline-block'}}>
        <TextInput
          ref={focusInputRef}
          placeholder="Link Text"
          label="Button label"
          value={linkText}
          disabled={disabled}
          onChange={e => onChange({...value, linkText: e.target.value})}
        />
      </Box>
      <Box style={{width: '50%', display: 'inline-block', padding: '10px'}}>
        <TextInput
          ref={focusInputRef}
          placeholder="Link URL"
          label="Button link"
          value={linkURL}
          disabled={disabled}
          onChange={e => onChange({...value, linkURL: e.target.value})}
        />
      </Box>
      <br />
      <br />
      <div className={'option-wrapper'} style={{display: 'flex'}}>
        <Card
          overflow="hidden"
          width={200}
          height={150}
          marginRight={Spacing.ExtraSmall}
          flexShrink={0}
          onClick={() => console.log(value, image)}>
          <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
            {image && (
              <Box position="relative" width="100%" height="100%">
                <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                  <IconButton
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setChooseModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setEditModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconClose}
                    title="Remove Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => onChange(value => ({...value, image: undefined}))}
                  />
                </Box>
                {image.previewURL && <Image src={image.previewURL} width="100%" height="100%" />}
              </Box>
            )}
          </PlaceholderInput>
        </Card>
        <Card
          overflow="hidden"
          width={200}
          height={150}
          marginRight={Spacing.ExtraSmall}
          onClick={() => console.log(value)}>
          <Box padding={'10'}>
            <p>Link Settings</p>
            <RadioGroup
              name={'linkTarget'}
              onChange={e => onChange({...value, linkTarget: e.target.value || '_self'})}
              value={linkTarget || 'internal'}>
              <Radio
                value={'_self'}
                label={'This browser tab'}
                checked={value.linkTarget === '_self'}
              />
              <Radio
                value={'_blank'}
                label={'New browser tab'}
                checked={value.linkTarget === '_blank'}
              />
            </RadioGroup>
          </Box>
        </Card>
        <Card
          overflow="hidden"
          width={200}
          height={150}
          flexGrow={1}
          marginRight={Spacing.ExtraSmall}>
          <Box padding={'10'}>
            <small>Styles: </small>
            <select
              defaultValue={styleOption}
              onChange={e => onChange({...value, styleOption: e.target.value || ''})}>
              <option value="default">Default Style</option>
              <option value="dark">Dark Style</option>
              <option value="image">Image Background</option>
            </select>
          </Box>
          <Box padding={'10'}>
            <small>Layouts: </small>
            <select
              defaultValue={layoutOption}
              onChange={e => onChange({...value, layoutOption: e.target.value || ''})}>
              <option value="default">Default Layout</option>
              <option value="right">Right Aligned</option>
              <option value="center">Centered</option>
              <option value="image-right">Image Right</option>
              <option value="image-left">Image Left</option>
            </select>
          </Box>
          <Box padding={'0 10'}>
            <Toggle
              label={'Hide CTA Button'}
              description={'Hide button an make whole element clickable.'}
              onChange={e => onChange({...value, hideButton: e.target.checked})}
              checked={!!hideButton || false}
            />
          </Box>
        </Card>
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
    </>
  )
}
