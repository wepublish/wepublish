import { useState } from 'react';

import { useSeededState } from '../hooks/use-seeded-state';

type UseSelectableListProps = {
  ids?: string[];
};

export function useSelectableList({ ids }: UseSelectableListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const allSelected = ids && selectedItems.length === ids.length;
  const someSelected = ids && selectedItems.length > 0;

  const toggleAll = () => setSelectedItems(someSelected ? [] : (ids ?? []));

  const selectItem = (id: string) => {
    setSelectedItems([...new Set([...selectedItems, id])]);
  };
  const unselectItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item !== id));
  };
  const toggleItem = (id: string | any, value?: boolean) => {
    if (value === undefined) {
      value = !selectedItems.includes(id);
    }
    if (value) {
      selectItem(id);
    } else {
      unselectItem(id);
    }
  };

  useSeededState(
    ids,
    available =>
      setSelectedItems(current =>
        current.filter(item => available.includes(item))
      ),
    ids?.join(',')
  );

  return {
    selectedItems,
    allSelected: someSelected && allSelected,
    someSelected: someSelected && !allSelected,
    toggleAll,
    selectItem,
    unselectItem,
    toggleItem,
  };
}
