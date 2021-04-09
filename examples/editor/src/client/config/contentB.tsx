import React, {useCallback, useState} from 'react'
import {ControlLabel, Form, FormControl, FormGroup, Modal} from 'rsuite'
import {isFunctionalUpdate} from '@karma.run/react'
import {
  RichTextBlock,
  RichTextBlockValue,
  Reference,
  RefSelectModal,
  ReferenceButton
} from '@wepublish/editor'
import {ContentContextEnum} from './article/api'

export interface ContentB_EditViewValue {
  readonly myString: string
  readonly myStringI18n: {
    [lang: string]: string
  }
  readonly myRichText: RichTextBlockValue
  readonly myRef?: Reference | null
}

export interface ContentB_EditViewProps {
  readonly value: ContentB_EditViewValue
  readonly onChange: React.Dispatch<React.SetStateAction<ContentB_EditViewValue>>
}

export function ContentB_EditView({value, onChange}: ContentB_EditViewProps) {
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

  return (
    <>
      <Form fluid={true} style={{width: '100%'}}>
        <FormGroup>
          <ControlLabel>myRef</ControlLabel>
          <ReferenceButton
            reference={myRef}
            onClick={() => setChooseModalOpen(true)}
            onClose={() => {
              onChange?.({...value, myRef: null})
            }}></ReferenceButton>
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

      <Modal show={isChooseModalOpen} size="lg" onHide={() => setChooseModalOpen(false)}>
        <RefSelectModal
          config={{
            modelA: {scope: ContentContextEnum.Local}
          }}
          onClose={() => setChooseModalOpen(false)}
          onSelectRef={ref => {
            setChooseModalOpen(false)
            onChange?.({...value, myRef: ref})
          }}
        />
      </Modal>
    </>
  )
}
