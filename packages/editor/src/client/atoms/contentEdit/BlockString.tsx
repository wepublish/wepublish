import React from 'react'
import {FormControl} from 'rsuite'
import {ContentModelSchemaFieldString} from '../../interfaces/contentModelSchema'
import {SchemaPath} from '../../interfaces/utilTypes'
import {ContentEditAction, ContentEditActionEnum} from '../../routes/contentEditor'

interface BlockStringProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value: any
  readonly model: ContentModelSchemaFieldString
}

function BlockString({dispatch, schemaPath, value}: BlockStringProps) {
  return (
    <FormControl
      componentClass="textarea"
      rows={3}
      value={value}
      onChange={val => dispatch({type: ContentEditActionEnum.update, value: val, schemaPath})}
    />
  )
}

export default React.memo(BlockString)
