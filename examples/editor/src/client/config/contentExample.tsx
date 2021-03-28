import React, {useCallback, useState} from 'react'
import {Button, ControlLabel, Drawer, Form, FormControl, FormGroup, Tag, TagGroup} from 'rsuite'
import {isFunctionalUpdate} from '@karma.run/react'
import {RichTextBlock, RichTextBlockValue, Reference, RefSelectPanel} from '@wepublish/editor'
import {ContentContextEnum, ContentTypeEnum} from './article/api'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface CustomContentValue {
  readonly myString: string
  readonly myRichText: RichTextBlockValue
  readonly myRef?: Reference
}

export interface CustomContentExampleProps {
  readonly value: CustomContentValue
  readonly onChange: React.Dispatch<React.SetStateAction<CustomContentValue>>
}

export function CustomContentExample({value, onChange}: CustomContentExampleProps) {
  if (!value) {
    return null
  }
  const {myString, myRichText, myRef} = value
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        myRichText: isFunctionalUpdate(richText) ? richText(value.myRichText) : richText
      })),
    [onChange]
  )

  let ref = null
  if (myRef) {
    const revSummary = `Type: ${myRef.contentType} Id: ${myRef.recordId}`
    ref = (
      <TagGroup>
        <Tag
          closable
          onClose={() => {
            onChange?.({...value, myRef: undefined})
          }}>
          {revSummary}
        </Tag>
      </TagGroup>
    )
  } else {
    ref = (
      <Button
        appearance="default"
        active
        onClick={teaser => {
          setChooseModalOpen(true)
        }}>
        reference to
      </Button>
    )
  }

  return (
    <>
      <Form fluid={true} style={{width: '100%'}}>
        <FormGroup>
          <ControlLabel>myRef</ControlLabel>
          {ref}
        </FormGroup>
        <FormGroup>
          <ControlLabel>myString</ControlLabel>
          <FormControl
            componentClass="textarea"
            rows={3}
            value={myString}
            onChange={myString => onChange?.({...value, myString})}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>myRichText</ControlLabel>
          <RichTextBlock value={myRichText} onChange={handleRichTextChange} />
        </FormGroup>
      </Form>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <RefSelectPanel
          types={[
            {context: ContentContextEnum.Local, type: ContentTypeEnum.Simple},
            {context: ContentContextEnum.Local, type: ContentTypeEnum.Article}
          ]}
          onClose={() => setChooseModalOpen(false)}
          onSelectRef={ref => {
            setChooseModalOpen(false)
            onChange?.({...value, myRef: ref})
          }}
        />
      </Drawer>
    </>
  )
}
