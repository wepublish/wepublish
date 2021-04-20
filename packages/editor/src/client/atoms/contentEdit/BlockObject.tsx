import React from 'react'
import BlockAbstract from './BlockAbstract'
import {ContentModelSchemaFieldObject} from '../../interfaces/contentModelSchema'
import {ControlLabel, FormGroup, Toggle} from 'rsuite'
import {SchemaPath} from '../../interfaces/utilTypes'

export function BlockObject(props: {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<any>
  readonly record: any
  readonly model: ContentModelSchemaFieldObject
}) {
  const content = Object.entries(props.model.fields).map(item => {
    const [key, fieldModel] = item
    const schemaPath = [...props.schemaPath]
    schemaPath.push(key)

    const hasContent = !!props.record[key]
    const required = fieldModel.required ? (
      <Toggle
        size="lg"
        checkedChildren="Active"
        unCheckedChildren="Inactive"
        checked={hasContent}
        onChange={() => {
          /* do nothing */
        }}
      />
    ) : null

    return (
      <FormGroup key={key}>
        <ControlLabel>{key}</ControlLabel>
        {required}
        <BlockAbstract
          schemaPath={schemaPath}
          dispatch={props.dispatch}
          model={fieldModel}
          content={props.record[key]}></BlockAbstract>
      </FormGroup>
    )
  })

  return <>{content}</>
}

export default BlockObject
