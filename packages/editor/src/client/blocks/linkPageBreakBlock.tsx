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
import {v4 as uuidv4} from 'uuid'
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
    image,
    templateOption
  } = value
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const focusInputRef = useRef<HTMLInputElement>(null)

  /* eslint-disable i18next/no-literal-string */
  /* eslint-disable @typescript-eslint/no-non-null-assertion */

  // const {t} = useTranslation()

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
      <div style={{display: 'flex', flexFlow: 'row wrap'}}>
        <div style={{flex: '1 0 25%', alignSelf: 'center', marginBottom: '10px'}}>
          <Card overflow="hidden" width={'100%'} height={150} padding={0}>
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
          <Box overflow="hidden" width={'100%'} height={'auto'} flexGrow={1}>
            <Box padding={'10 10 2 10'}>
              <small>Styles: </small>
              <br />
              <select
                style={{width: '195px'}}
                defaultValue={styleOption}
                onChange={e => onChange({...value, styleOption: e.target.value || ''})}>
                <option value="default">Default Style</option>
                <option value="dark">Dark Style</option>
                <option value="image">Image Background</option>
              </select>
            </Box>
            <Box padding={'2 10'}>
              <small>Layouts: </small>
              <br />
              <select
                style={{width: '195px'}}
                value={styleOption === 'image' ? 'default' : layoutOption}
                onChange={e => onChange({...value, layoutOption: e.target.value || ''})}>
                <option value="default">Default Layout</option>
                <option disabled={styleOption === 'image'} value="right">
                  Right Aligned
                </option>
                <option disabled={styleOption === 'image'} value="center">
                  Centered
                </option>
                <option disabled={styleOption === 'image'} value="image-right">
                  Image Right
                </option>
                <option disabled={styleOption === 'image'} value="image-left">
                  Image Left
                </option>
              </select>
            </Box>
            <Box padding={'2 10'}>
              <small>Templates: </small>
              <br />
              <select
                style={{width: '195px'}}
                defaultValue={templateOption}
                onChange={e => onChange({...value, templateOption: e.target.value || ''})}>
                <option value="none">None</option>
                <option value="donation">Donation</option>
                <option value="membership">Membership</option>
                <option value="subscription">Subscription</option>
              </select>
            </Box>
          </Box>
        </div>
        <div style={{flex: '1 0 70%'}}>
          <Box padding={Spacing.ExtraSmall} marginBottom={Spacing.ExtraSmall}>
            <Box>
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
              <RichTextBlock
                value={richText || createDefaultValue()}
                onChange={handleRichTextChange}
              />
            </Box>
          </Box>
          <Card padding={Spacing.ExtraSmall}>
            <Box style={{width: '50%', display: 'inline-block'}}>
              <TextInput
                ref={focusInputRef}
                placeholder="https://..."
                label="CTA Button link URL"
                value={linkURL}
                disabled={disabled}
                onChange={e => onChange({...value, linkURL: e.target.value})}
              />
            </Box>
            {!hideButton && (
              <Box style={{width: '50%', display: 'inline-block'}}>
                <TextInput
                  ref={focusInputRef}
                  placeholder="CTA Button label"
                  label="CTA Button label"
                  value={linkText}
                  disabled={disabled}
                  onChange={e => onChange({...value, linkText: e.target.value})}
                />
              </Box>
            )}
            <div style={{display: 'flex', marginTop: Spacing.ExtraSmall}}>
              <Box width={'50%'}>
                <RadioGroup
                  name={'radiogroup-' + uuidv4()}
                  onChange={e => onChange({...value, linkTarget: e.target.value || '_self'})}
                  value={linkTarget || '_self'}>
                  <Radio
                    value={'_self'}
                    label={'This browser tab'}
                    checked={(value.linkTarget || linkTarget) === '_self'}
                  />
                  <Radio
                    value={'_blank'}
                    label={'New browser tab'}
                    checked={(value.linkTarget || linkTarget) === '_blank'}
                  />
                </RadioGroup>
              </Box>
              <Box width={'50%'}>
                <Toggle
                  label={'Hide CTA Button'}
                  description={'Hide button an make whole element clickable.'}
                  onChange={e => onChange({...value, hideButton: e.target.checked})}
                  checked={!!hideButton || false}
                />
              </Box>
            </div>
          </Card>
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
    </>
  )
}
