import React, {memo} from 'react'
import {Toggle} from 'rsuite'
import {ContentModelSchemaFieldBoolean} from '../../interfaces/contentModelSchema'
import {SchemaPath} from '../../interfaces/utilTypes'
import {ContentEditAction, ContentEditActionEnum} from '../../routes/contentEditor'

interface BlockBooleanProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value: boolean
  readonly model: ContentModelSchemaFieldBoolean
}
function BlockBoolean({value, schemaPath, dispatch}: BlockBooleanProps) {
  return (
    <Toggle
      checked={value}
      onChange={val =>
        dispatch({type: ContentEditActionEnum.update, value: Boolean(val), schemaPath})
      }
    />
  )
}

export default memo(BlockBoolean)
