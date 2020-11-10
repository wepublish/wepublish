import React from 'react'
import nanoid from 'nanoid'
import {SortableHandle, SortableContainer, SortableElement} from 'react-sortable-hoc'
import arrayMove from 'array-move'

import {isFunctionalUpdate} from '@karma.run/react'

import {Icon, IconButton, Panel} from 'rsuite'

export interface FieldProps<V = any> {
  readonly value: V
  readonly onChange: React.Dispatch<React.SetStateAction<V>>
}

export interface ListFieldProps<T = any> extends FieldProps<ListValue<T>[]> {
  readonly label?: string
  readonly defaultValue: T | (() => T)
  readonly disabled?: boolean
  readonly children: (props: FieldProps<T>) => JSX.Element
}

export interface ListValue<T = any> {
  readonly id: string
  readonly value: T
}

export interface ListItemProps<T = any> {
  readonly value: ListValue<T>
  readonly itemIndex: number
  readonly itemDisabled?: boolean
  readonly onChange: (index: number, value: React.SetStateAction<ListValue<T>>) => void
  readonly onRemove: (index: number) => void
  readonly children: (props: FieldProps<T>) => JSX.Element
}

const DragHandle = SortableHandle(({disabled}: {disabled?: boolean}) => (
  <IconButton icon={<Icon icon="th2" />} disabled={disabled} />
))

const ListItem = SortableElement(
  ({value, itemIndex, itemDisabled, onChange, onRemove, children}: ListItemProps) => {
    function handleValueChange(fieldValue: React.SetStateAction<any>) {
      onChange(itemIndex, value => ({
        ...value,
        value: isFunctionalUpdate(fieldValue) ? fieldValue(value.value) : fieldValue
      }))
    }

    function handleRemove() {
      onRemove(itemIndex)
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          marginBottom: '10px'
        }}>
        <div style={{marginRight: '10px'}}>
          <DragHandle disabled={itemDisabled} />
        </div>
        <Panel style={{width: '100%'}}>
          <div style={{padding: '10px', minHeight: '100%'}}>
            {children({value: value.value, onChange: handleValueChange})}
          </div>
        </Panel>
        <div style={{marginLeft: '10px'}}>
          <IconButton icon={<Icon icon="trash" />} onClick={handleRemove} disabled={itemDisabled} />
        </div>
      </div>
    )
  }
)

const SortableList = SortableContainer(
  ({value, defaultValue, disabled, children, onChange}: ListFieldProps) => {
    function handleItemChange(itemIndex: number, itemValue: React.SetStateAction<ListValue>) {
      onChange(value =>
        Object.assign([], value, {
          [itemIndex]: isFunctionalUpdate(itemValue) ? itemValue(value[itemIndex]) : itemValue
        })
      )
    }

    function handleAdd() {
      onChange(value => [...value, {id: nanoid(), value: defaultValue}])
    }

    function handleRemove(itemIndex: number) {
      onChange(value => value.filter((_, index) => index !== itemIndex))
    }

    return (
      <div>
        {value.map((value: any, index: number) => (
          <ListItem
            key={value.id}
            itemIndex={index}
            index={index}
            value={value}
            itemDisabled={disabled}
            onChange={handleItemChange}
            onRemove={handleRemove}>
            {children}
          </ListItem>
        ))}
        <IconButton icon={<Icon icon="plus-circle" />} onClick={handleAdd} disabled={disabled} />
      </div>
    )
  }
)

/* const ListItemHelperStyle = cssRule({
  zIndex: 6
})

helperClass={css(ListItemHelperStyle)}
 */

export function ListInput<T>({
  value,
  label,
  defaultValue,
  disabled,
  children,
  onChange
}: ListFieldProps<T>) {
  const onSortEnd = ({oldIndex, newIndex}: {oldIndex: number; newIndex: number}) => {
    onChange(arrayMove(value, oldIndex, newIndex))
  }

  return (
    <div>
      {label && <label>{label}</label>}
      <SortableList
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        children={children} // eslint-disable-line react/no-children-prop
        onChange={onChange}
        onSortEnd={onSortEnd}
        useDragHandle
      />
    </div>
  )
}
