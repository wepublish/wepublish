import {isFunctionalUpdate} from '@karma.run/react'
import React from 'react'
import {ContentContextEnum} from '../../api'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {ContentModelSchemaFieldString} from '../../interfaces/contentModelSchema'
import {SchemaPath} from '../../interfaces/utilTypes'
import {ContentEditAction, ContentEditActionEnum} from '../../routes/contentEditor'

interface BlockRichTextProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value: any
  readonly model: ContentModelSchemaFieldString
}

function BlockRichText({dispatch, schemaPath, value}: BlockRichTextProps) {
  return (
    <RichTextBlock
      value={value}
      onChange={richText => {
        const update = isFunctionalUpdate(richText) ? richText(value.myRichText) : richText
        dispatch({
          type: ContentEditActionEnum.update,
          value: update,
          schemaPath
        })
      }}
      config={{
        ref: {
          modelA: {scope: ContentContextEnum.Local}
        }
      }}
    />
  )
}

export default React.memo(BlockRichText)
