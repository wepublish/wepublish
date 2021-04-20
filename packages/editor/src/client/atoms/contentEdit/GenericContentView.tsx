import React from 'react'
import {Form} from 'rsuite'
import {ContentModelSchemaTypes} from '../../interfaces/apiTypes'
import {ContentModelSchemaFieldObject} from '../../interfaces/contentModelSchema'
import {MapType} from '../../interfaces/utilTypes'
import BlockObject from './BlockObject'

interface GenericContentView {
  readonly model: MapType<ContentModelSchemaFieldObject>
  readonly record: any
  readonly dispatch: React.Dispatch<any>
}

export function GenericContentView({model, record, dispatch}: GenericContentView) {
  return (
    <Form fluid={true} style={{width: '100%'}}>
      <BlockObject
        dispatch={dispatch}
        model={{
          type: ContentModelSchemaTypes.object,
          fields: model
        }}
        record={record}
        schemaPath={[]}></BlockObject>
    </Form>
  )
}
