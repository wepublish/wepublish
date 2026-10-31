export const canAddToImageSelection = (selection: string[], max?: number) =>
  max === undefined || selection.length < max;

export const addToImageSelection = (
  selection: string[],
  id: string,
  max?: number
) =>
  selection.includes(id) || !canAddToImageSelection(selection, max) ?
    selection
  : [...selection, id];

export const toggleImageSelection = (
  selection: string[],
  id: string,
  max?: number
) =>
  selection.includes(id) ?
    selection.filter(selected => selected !== id)
  : addToImageSelection(selection, id, max);
