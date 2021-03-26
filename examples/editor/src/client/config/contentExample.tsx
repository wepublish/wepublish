import React, {useCallback} from 'react'
import {ControlLabel, Form, FormControl, FormGroup} from 'rsuite'
import {isFunctionalUpdate} from '@karma.run/react'
import {RichTextBlock, RichTextBlockValue} from '@wepublish/editor'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface ArticleMetadata {
  readonly myString: string
  readonly myRichText: RichTextBlockValue
}

export interface ArticleMetadataPanelProps {
  readonly value: ArticleMetadata
  onChange: React.Dispatch<React.SetStateAction<ArticleMetadata>>
}

export function CustomContentExample({value, onChange}: ArticleMetadataPanelProps) {
  if (!value) {
    return null
  }
  const {myString, myRichText} = value
  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        myRichText: isFunctionalUpdate(richText) ? richText(value.myRichText) : richText
      })),
    [onChange]
  )

  return (
    <>
      <Form fluid={true} style={{width: '100%'}}>
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
    </>
  )
}
