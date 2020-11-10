import React, {useState, useCallback} from 'react'

import {BlockProps} from '../atoms/blockList'
import {ListInput, FieldProps} from '../atoms/listInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'
import {PlaceholderInput} from '../atoms/placeholderInput'

import {IconButton, Drawer, Panel, Dropdown, Icon} from 'rsuite'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'

import {ListicleBlockValue, ListicleItem, RichTextBlockValue} from './types'
import {createDefaultValue, RichTextBlock} from './richTextBlock'
import {isFunctionalUpdate} from '@karma.run/react'

import {useTranslation} from 'react-i18next'

export function ListicleBlock({value, onChange, disabled}: BlockProps<ListicleBlockValue>) {
  return (
    <ListInput
      value={value.items}
      onChange={items =>
        onChange(value => ({
          items: isFunctionalUpdate(items) ? items(value.items) : items
        }))
      }
      defaultValue={{image: null, richText: createDefaultValue(), title: ''}}
      disabled={disabled}>
      {props => <ListicleItemElement {...props} />}
    </ListInput>
  )
}

export function ListicleItemElement({value, onChange}: FieldProps<ListicleItem>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {image, title, richText} = value

  const {t} = useTranslation()

  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        richText: isFunctionalUpdate(richText) ? richText(value.richText) : richText
      })),
    [onChange]
  )

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row'
        }}>
        <Panel
          bodyFill={true}
          bordered={true}
          style={{
            overflow: 'hidden',
            width: 200,
            height: 150,
            marginRight: 10,
            flexShrink: 0
          }}>
          <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
            {image && (
              <Panel
                bordered={true}
                style={{
                  height: '200px',
                  backgroundSize: 'cover',
                  backgroundImage: `url(${
                    image?.previewURL ?? 'https://via.placeholder.com/240x240'
                  })`
                }}>
                <Dropdown
                  renderTitle={() => {
                    return <IconButton appearance="subtle" icon={<Icon icon="wrench" />} circle />
                  }}>
                  <Dropdown.Item onClick={() => setChooseModalOpen(true)}>
                    <Icon icon="image" /> {t('peerList.panels.chooseImage')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setEditModalOpen(true)}>
                    <Icon icon="pencil" /> {t('peerList.panels.editImage')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onChange(value => ({...value, image: null}))}>
                    <Icon icon="close" /> {t('peerList.panels.removeImage')}
                  </Dropdown.Item>
                </Dropdown>
              </Panel>
            )}
          </PlaceholderInput>
        </Panel>
        <div style={{flexGrow: 1}}>
          <TypographicTextArea
            variant="h1"
            placeholder={t('blocks.listicle.title')}
            value={title}
            onChange={e => {
              const title = e.target.value
              onChange(value => ({...value, title}))
            }}
          />

          <RichTextBlock value={richText} onChange={handleRichTextChange} />
        </div>
      </div>

      <Drawer show={isChooseModalOpen} sizw={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            onChange(value => ({...value, image}))
          }}
        />
      </Drawer>
      {image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}
