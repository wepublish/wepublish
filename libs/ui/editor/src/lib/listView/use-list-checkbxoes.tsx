import {useEffect, useState} from 'react'

type UseListCheckboxesProps = {
  ids?: string[]
}

export function useListCheckboxes({ids}: UseListCheckboxesProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const allSelected = ids && selectedItems.length === ids.length
  const someSelected = ids && selectedItems.length > 0

  const onChangeAll = (value: any, checked: boolean) =>
    setSelectedItems(checked ? [...(ids ?? [])] : [])
  const onChangeSingle = (id: any, checked: boolean) => {
    setSelectedItems(
      checked ? [...new Set([...selectedItems, id])] : selectedItems.filter(item => item !== id)
    )
  }

  useEffect(() => {
    if (ids !== undefined) {
      setSelectedItems(ids.filter(item => selectedItems.includes(item)))
    }
  }, [ids])

  return {
    selectedItems,
    allSelected: someSelected && allSelected,
    someSelected: someSelected && !allSelected,
    onChangeItem: onChangeSingle,
    onChangeAll
  }
}
