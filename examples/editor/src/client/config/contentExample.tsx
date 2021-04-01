import React, {useCallback, useState} from 'react'
import {Button, ControlLabel, Drawer, Form, FormControl, FormGroup, Tag, TagGroup} from 'rsuite'
import {isFunctionalUpdate} from '@karma.run/react'
import {
  Link,
  ContentEditRoute,
  RichTextBlock,
  RichTextBlockValue,
  Reference,
  RefSelectPanelDrawer
} from '@wepublish/editor'
import {ContentContextEnum, useModelAQuery} from './article/api'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface CustomContentValue {
  readonly myString: string
  readonly myRichText: RichTextBlockValue
  readonly myRef?: Reference | null
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
            onChange?.({...value, myRef: null})
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
          <RichTextBlock
            value={myRichText}
            onChange={handleRichTextChange}
            config={{
              bold: true,
              italic: true,
              url: true,
              ref: {
                modelA: {scope: ContentContextEnum.Local},
                modelB: {scope: ContentContextEnum.Local}
              }
            }}
          />
        </FormGroup>
      </Form>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <RefSelectPanelDrawer
          config={{
            modelA: {scope: ContentContextEnum.Local},
            modelB: {scope: ContentContextEnum.Local}
          }}
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

export function ModelBView({value, onChange}: CustomContentExampleProps) {
  if (!value) {
    return null
  }
  const {myString, myRichText, myRef} = value
  const {data} = useModelAQuery({
    skip: myRef?.record || !myRef?.recordId,
    variables: {
      id: myRef?.recordId!
    }
  })
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
    const referenceSummary = (
      <Link route={ContentEditRoute.create({type: myRef.contentType, id: myRef.recordId})}>
        Type: {myRef.contentType} Id: {myRef.recordId}
      </Link>
    )
    let referencePreview: any = null
    if (data?.content.modelA.read.title) {
      const {title, content} = data.content.modelA.read
      referencePreview = `${title} ${content?.myString}`
    }
    ref = (
      <TagGroup>
        <Tag
          closable
          onClose={() => {
            onChange?.({...value, myRef: null})
          }}>
          {referenceSummary}
          <br />
          {referencePreview}
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
          <RichTextBlock
            value={myRichText}
            onChange={handleRichTextChange}
            config={{
              ref: {
                modelA: {scope: ContentContextEnum.Local}
              }
            }}
          />
        </FormGroup>
      </Form>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <RefSelectPanelDrawer
          config={{
            modelA: {scope: ContentContextEnum.Local}
          }}
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
