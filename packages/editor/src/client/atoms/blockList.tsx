import React, {Fragment, useState, ReactNode, useCallback, useMemo, memo} from 'react'
import nanoid from 'nanoid'

import {isFunctionalUpdate} from '@karma.run/react'
import {isValueConstructor, ValueConstructor, UnionToIntersection} from '@karma.run/utility'

import {AddBlockInput} from './addBlockInput'
import {IconButton, Icon, Panel} from 'rsuite'
import {IconNames} from 'rsuite/lib/Icon/Icon'
import {SVGIcon} from 'rsuite/lib/@types/common'

export interface BlockProps<V = any> {
  value: V
  onChange: React.Dispatch<React.SetStateAction<V>>
  autofocus?: boolean
  disabled?: boolean
}

export type BlockConstructorFn<V = any> = (props: BlockProps<V>) => JSX.Element

export interface BlockCaseProps<V = any> {
  label: string
  icon: IconNames | SVGIcon
  defaultValue: ValueConstructor<V>
  field: BlockConstructorFn<V>
}

export interface BlockListValue<T extends string = string, V = any> {
  key: string
  type: T
  value: V
}

export type BlockMap = Record<string, BlockCaseProps>

export type BlockMapForValue<R extends BlockListValue> = UnionToIntersection<
  R extends BlockListValue<infer T, infer V> ? {[K in T]: BlockCaseProps<V>} : never
>

export interface BlockListItemProps<T extends string = string, V = any> {
  index: number
  value: BlockListValue<T, V>
  icon: IconNames | SVGIcon
  autofocus: boolean
  disabled?: boolean

  onChange: (index: number, value: React.SetStateAction<BlockListValue<T, V>>) => void
  onDelete: (index: number) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  children: (props: BlockProps<V>) => JSX.Element
}

const BlockListItem = memo(function BlockListItem({
  index,
  value,
  icon,
  autofocus,
  disabled,
  children,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}: BlockListItemProps) {
  const handleValueChange = useCallback(
    (fieldValue: React.SetStateAction<any>) => {
      onChange(index, value => ({
        ...value,
        value: isFunctionalUpdate(fieldValue) ? fieldValue(value.value) : fieldValue
      }))
    },
    [onChange, index]
  )

  return (
    <ListItemWrapper
      icon={icon}
      disabled={disabled}
      onDelete={() => onDelete(index)}
      onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
      onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}>
      {children({value: value.value, onChange: handleValueChange, autofocus, disabled})}
    </ListItemWrapper>
  )
})

export function useBlockMap<V extends BlockListValue>(
  map: () => BlockMapForValue<V>,
  deps: ReadonlyArray<any> | undefined
) {
  return useMemo(map, deps)
}

export interface BlockListProps<V extends BlockListValue> extends BlockProps<V[]> {
  children: BlockMapForValue<V>
}

export function BlockList<V extends BlockListValue>({
  value: values,
  children,
  disabled,
  onChange
}: BlockListProps<V>) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null)

  const blockMap = children as BlockMap

  const handleItemChange = useCallback(
    (index: number, itemValue: React.SetStateAction<BlockListValue>) => {
      onChange((value: any) =>
        Object.assign([], value, {
          [index]: isFunctionalUpdate(itemValue) ? itemValue(value[index]) : itemValue
        })
      )
    },
    [onChange]
  )

  const handleAdd = useCallback(
    (index: number, type: string) => {
      setFocusIndex(index)
      onChange((values: any) => {
        const {defaultValue} = blockMap[type]
        const valuesCopy = values.slice()

        valuesCopy.splice(index, 0, {
          key: nanoid(),
          type,
          value: isValueConstructor(defaultValue) ? defaultValue() : defaultValue
        } as V)

        return valuesCopy
      })
    },
    [blockMap, onChange]
  )

  const handleRemove = useCallback(
    (itemIndex: number) => {
      onChange((value: any) => value.filter((value: any, index: any) => index !== itemIndex))
    },
    [onChange]
  )

  const handleMoveIndex = useCallback(
    (from: number, to: number) => {
      onChange((values: any) => {
        const valuesCopy = values.slice()
        const [value] = valuesCopy.splice(from, 1)

        valuesCopy.splice(to, 0, value)

        return valuesCopy
      })
    },
    [onChange]
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      handleMoveIndex(index, index - 1)
    },
    [handleMoveIndex]
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      handleMoveIndex(index, index + 1)
    },
    [handleMoveIndex]
  )

  function addButtonForIndex(index: number) {
    return (
      <div
        style={{
          paddingLeft: 30,
          paddingRight: 30,
          marginTop: 10,
          marginBottom: 10,
          textAlign: 'center'
        }}>
        <AddBlockInput
          menuItems={Object.entries(blockMap).map(([type, {icon, label}]) => ({
            id: type,
            icon,
            label
          }))}
          onMenuItemClick={({id}: {id: string}) => handleAdd(index, id)}
          subtle={index !== values.length || disabled}
          disabled={disabled}
        />
      </div>
    )
  }

  function listItemForIndex(value: V, index: number) {
    const hasPrevIndex = index - 1 >= 0
    const hasNextIndex = index + 1 < values.length
    const blockDef = blockMap[value.type]

    return (
      <Fragment key={value.key}>
        <BlockListItem
          index={index}
          value={value}
          icon={blockDef.icon}
          onDelete={handleRemove}
          onChange={handleItemChange}
          onMoveUp={hasPrevIndex ? handleMoveUp : undefined}
          onMoveDown={hasNextIndex ? handleMoveDown : undefined}
          autofocus={focusIndex === index}
          disabled={disabled}>
          {blockDef.field}
        </BlockListItem>
        {addButtonForIndex(index + 1)}
      </Fragment>
    )
  }

  return (
    <div
      style={{
        width: '100%'
      }}>
      {addButtonForIndex(0)}
      {values.map((value: any, index: any) => listItemForIndex(value, index))}
    </div>
  )
}

interface ListItemWrapperProps {
  children?: ReactNode
  icon?: IconNames | SVGIcon
  disabled?: boolean

  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

function ListItemWrapper({
  children,
  icon,
  disabled,
  onDelete,
  onMoveUp,
  onMoveDown
}: ListItemWrapperProps) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%'
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginRight: 10
        }}>
        <IconButton
          icon={<Icon icon="trash" />}
          onClick={onDelete}
          disabled={onDelete == null || disabled}
        />
        <div style={{flexGrow: 1}} />
        <div style={{marginTop: 10, marginBottom: 5}}>
          <IconButton
            icon={<Icon icon="arrow-up" />}
            onClick={onMoveUp}
            disabled={onMoveUp == null || disabled}
          />
        </div>
        <div style={{marginBottom: 10}}>
          <IconButton
            title=""
            icon={<Icon icon="arrow-down" />}
            onClick={onMoveDown}
            disabled={onMoveDown == null || disabled}
          />
        </div>
        <div style={{flexGrow: 1}} />
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%'
        }}>
        <Panel style={{width: '100%'}} bordered={true}>
          <div style={{padding: 20}}>{children}</div>
        </Panel>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 10,
          fontSize: 24,
          fill: 'gray'
        }}>
        {icon && <Icon icon={icon} />}
      </div>
    </div>
  )
}
