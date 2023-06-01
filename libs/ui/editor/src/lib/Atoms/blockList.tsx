import styled from '@emotion/styled'
import nanoid from 'nanoid'
import React, {Fragment, memo, ReactNode, useCallback, useMemo, useState} from 'react'
import {MdArrowDownward, MdArrowUpward, MdDelete} from 'react-icons/md'
import {IconButton, Panel as RPanel} from 'rsuite'

import {
  isFunctionalUpdate,
  isValueConstructor,
  UnionToIntersection,
  ValueConstructor
} from '../utility'
import {AddBlockInput} from './addBlockInput'

const IconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  fill: gray;
`

const ChildrenWrapper = styled.div`
  padding: 20px;
`

const Panel = styled(RPanel)`
  width: 100%;
`

const PanelWrapper = styled.div`
  display: flex;
  width: 100%;
`

const DownwardButtonWrapper = styled.div`
  margin-bottom: 10px;
`

const UpwardButtonWrapper = styled.div`
  margin-top: 10px;
  margin-bottom: 5px;
`

const FlexGrow = styled.div`
  flex-grow: 1;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 10px;
`

const ListItem = styled.div`
  display: flex;
  width: 100%;
`

const AddButton = styled.div`
  width: 100%;
`

const AddBlockInputWrapper = styled.div`
  padding-left: 30px;
  padding-right: 30px;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
`

export interface BlockProps<V = any> {
  itemId?: string | null
  value: V
  onChange: React.Dispatch<React.SetStateAction<V>>
  autofocus?: boolean
  disabled?: boolean
}

export type BlockConstructorFn<V = any> = (props: BlockProps<V>) => JSX.Element

export interface BlockCaseProps<V = any> {
  label: string
  icon: React.ReactElement
  defaultValue: ValueConstructor<V>
  field: BlockConstructorFn<V>
}

export interface BlockListValue<T extends string = string, V = any> {
  key: string
  type: T
  value: V
}

type BlockMap = Record<string, BlockCaseProps>

export type BlockMapForValue<R extends BlockListValue> = UnionToIntersection<
  R extends BlockListValue<infer T, infer V> ? {[K in T]: BlockCaseProps<V>} : never
>

export interface BlockListItemProps<T extends string = string, V = any> {
  itemId: string | null | undefined
  index: number
  value: BlockListValue<T, V>
  icon: React.ReactElement
  autofocus: boolean
  disabled?: boolean

  onChange: (index: number, value: React.SetStateAction<BlockListValue<T, V>>) => void
  onDelete: (index: number) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  children: (props: BlockProps<V>) => JSX.Element
}

const BlockListItem = memo(function BlockListItem({
  itemId,
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
      {children({value: value.value, onChange: handleValueChange, autofocus, disabled, itemId})}
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
  itemId,
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
      <AddBlockInputWrapper>
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
      </AddBlockInputWrapper>
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
          itemId={itemId}
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
    <AddButton>
      {addButtonForIndex(0)}
      {values.map((value: any, index: any) => listItemForIndex(value, index))}
    </AddButton>
  )
}

interface ListItemWrapperProps {
  children?: ReactNode
  icon?: React.ReactElement
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
    <ListItem>
      <Wrapper>
        <IconButton
          icon={<MdDelete />}
          onClick={onDelete}
          disabled={onDelete == null || disabled}
        />
        <FlexGrow />
        <UpwardButtonWrapper>
          <IconButton
            icon={<MdArrowUpward />}
            onClick={onMoveUp}
            disabled={onMoveUp == null || disabled}
          />
        </UpwardButtonWrapper>
        <DownwardButtonWrapper>
          <IconButton
            title=""
            icon={<MdArrowDownward />}
            onClick={onMoveDown}
            disabled={onMoveDown == null || disabled}
          />
        </DownwardButtonWrapper>
        <FlexGrow />
      </Wrapper>
      <PanelWrapper>
        <Panel bordered>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Panel>
      </PanelWrapper>
      <IconWrapper>{icon}</IconWrapper>
    </ListItem>
  )
}
