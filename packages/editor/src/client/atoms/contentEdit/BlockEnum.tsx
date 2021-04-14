import React from 'react'
import {SelectPicker} from 'rsuite'
import {ContentModelSchemaFieldEnum} from '../../interfaces/contentModelSchema'
import {SchemaPath} from '../../interfaces/utilTypes'
import {ContentEditAction, ContentEditActionEnum} from '../../routes/contentEditor'

interface BlockEnumProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value: unknown
  readonly model: ContentModelSchemaFieldEnum
}

function BlockEnum({value, dispatch, model, schemaPath}: BlockEnumProps) {
  const data = model.values.map(val => {
    return {
      label: val.description,
      value: val.value
    }
  })

  return (
    <SelectPicker
      cleanable={false}
      data={data}
      value={value}
      onChange={val => {
        dispatch({
          type: ContentEditActionEnum.update,
          value: val,
          schemaPath
        })
      }}
    />
  )
}

export default React.memo(BlockEnum)
