import React from 'react'
import BlockObject from './BlockObject'
import BlockString from './BlockString'
import BlockEnum from './BlockEnum'
import BlockFloat from './BlockFloat'
import BlockBoolean from './BlockBoolean'
import BlockList from './BlockList'
import BlockUnion from './BlockUnion'
import BlockRef from './BlockRef'
import {
  ContentModelSchemaFieldBase,
  ContentModelSchemaFieldBoolean,
  ContentModelSchemaFieldEnum,
  ContentModelSchemaFieldFloat,
  ContentModelSchemaFieldInt,
  ContentModelSchemaFieldList,
  ContentModelSchemaFieldObject,
  ContentModelSchemaFieldRef,
  ContentModelSchemaFieldString,
  ContentModelSchemaFieldUnion,
  ContentModelSchemaTypes
} from '../../interfaces/contentModelSchema'
import BlockInt from './BlockInt'
import {SchemaPath} from '../../interfaces/utilTypes'
import BlockRichText from './BlockRichText'

interface BlockAbstractProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<any>
  readonly content: any | null
  readonly model: ContentModelSchemaFieldBase | null
}

function BlockAbstract(props: BlockAbstractProps) {
  if (!props.model) {
    return null
  }

  const updatePath = props.schemaPath
  let block: any = null
  if (props.model.type === ContentModelSchemaTypes.object) {
    block = (
      <BlockObject
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldObject}
        record={props.content}></BlockObject>
    )
  } else if (props.model.type === ContentModelSchemaTypes.string) {
    block = (
      <BlockString
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldString}
        value={props.content}></BlockString>
    )
  } else if (props.model.type === ContentModelSchemaTypes.richText) {
    block = (
      <BlockRichText
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldString}
        value={props.content}></BlockRichText>
    )
  } else if (props.model.type === ContentModelSchemaTypes.enum) {
    block = (
      <BlockEnum
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldEnum}
        value={props.content}></BlockEnum>
    )
  } else if (props.model.type === ContentModelSchemaTypes.int) {
    block = (
      <BlockInt
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldInt}
        value={props.content}></BlockInt>
    )
  } else if (props.model.type === ContentModelSchemaTypes.float) {
    block = (
      <BlockFloat
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldFloat}
        value={props.content}></BlockFloat>
    )
  } else if (props.model.type === ContentModelSchemaTypes.boolean) {
    block = (
      <BlockBoolean
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldBoolean}
        value={props.content}></BlockBoolean>
    )
  } else if (props.model.type === ContentModelSchemaTypes.list) {
    block = (
      <BlockList
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldList}
        value={props.content}></BlockList>
    )
  } else if (props.model.type === ContentModelSchemaTypes.union) {
    block = (
      <BlockUnion
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldUnion}
        value={props.content}></BlockUnion>
    )
  } else if (props.model.type === ContentModelSchemaTypes.reference) {
    block = (
      <BlockRef
        schemaPath={updatePath}
        dispatch={props.dispatch}
        model={props.model as ContentModelSchemaFieldRef}
        value={props.content}></BlockRef>
    )
  }

  if (!block) {
    return block
  }

  return (
    <div>
      {/** TODO some instructions */}
      {block}
    </div>
  )
}

export default BlockAbstract
