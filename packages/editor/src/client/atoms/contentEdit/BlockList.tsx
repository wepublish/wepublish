import React from 'react'
import {ContentModelSchemaFieldList} from '../../interfaces/contentModelSchema'
import {Icon, IconButton, List} from 'rsuite'
import {SchemaPath} from '../../interfaces/utilTypes'
import BlockAbstract from './BlockAbstract'
import {
  ContentEditAction,
  ContentEditActionEnum,
  generateEmptyContent
} from '../../routes/contentEditor'

interface BlockListProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value: unknown[]
  readonly model: ContentModelSchemaFieldList
}

export function BlockList({dispatch, model, value, schemaPath}: BlockListProps) {
  const childSchemaPath = [...schemaPath]

  const content = value.map((item, index, array) => {
    let buttonUp = null
    if (index !== 0) {
      buttonUp = (
        <IconButton
          icon={<Icon icon="up" />}
          onClick={() => {
            dispatch({
              type: ContentEditActionEnum.splice,
              schemaPath: childSchemaPath,
              start: index - 1,
              delete: 2,
              insert: [item, array[index - 1]]
            })
          }}
        />
      )
    }
    let buttonDown = null
    if (index !== array.length - 1) {
      buttonDown = (
        <IconButton
          icon={<Icon icon="down" />}
          onClick={() => {
            dispatch({
              type: ContentEditActionEnum.splice,
              schemaPath: childSchemaPath,
              start: index,
              delete: 2,
              insert: [array[index + 1], item]
            })
          }}
        />
      )
    }

    return (
      <List.Item key={index} index={index}>
        <IconButton
          icon={<Icon icon="plus" />}
          onClick={() => {
            dispatch({
              type: ContentEditActionEnum.splice,
              schemaPath: childSchemaPath,
              start: index + 1,
              delete: 0,
              insert: [generateEmptyContent(model.contentType)]
            })
          }}
        />

        <IconButton
          icon={<Icon icon="minus" />}
          onClick={() => {
            dispatch({
              type: ContentEditActionEnum.splice,
              schemaPath: childSchemaPath,
              start: index,
              delete: 1,
              insert: []
            })
          }}
        />

        {buttonUp}
        {buttonDown}

        <BlockAbstract
          schemaPath={[...childSchemaPath, index]}
          dispatch={dispatch}
          model={model.contentType}
          content={item}></BlockAbstract>
      </List.Item>
    )
  })

  return (
    <>
      <List>{content}</List>
      <IconButton
        icon={<Icon icon="plus" />}
        onClick={() => {
          dispatch({
            type: ContentEditActionEnum.push,
            schemaPath: childSchemaPath,
            insert: [generateEmptyContent(model.contentType)]
          })
        }}
      />
    </>
  )
}

export default BlockList
