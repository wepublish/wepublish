import React from 'react'
import {InputNumber} from 'rsuite'
import {ContentModelSchemaFieldInt} from '../../interfaces/contentModelSchema'
import {SchemaPath} from '../../interfaces/utilTypes'
import {ContentEditAction, ContentEditActionEnum} from '../../routes/contentEditor'

interface BlockIntProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value: number
  readonly model: ContentModelSchemaFieldInt
}
function BlockInt({value, schemaPath, dispatch}: BlockIntProps) {
  const Max32BitIntSize = Math.pow(2, 31) - 1
  return (
    <InputNumber
      value={value}
      step={1}
      onChange={val =>
        dispatch({
          type: ContentEditActionEnum.update,
          value: Math.min(Math.max(Number(val), -Max32BitIntSize), Max32BitIntSize),
          schemaPath
        })
      }
    />
  )
}

export default BlockInt
