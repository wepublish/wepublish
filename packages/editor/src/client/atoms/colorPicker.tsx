import React from 'react'

interface ColorPickerProps {
  withColor: (color: string) => void
  currentColor?: string
}

export function ColorPicker({withColor, currentColor = '#000'}: ColorPickerProps) {
  return <input type="color" value={currentColor} onChange={e => withColor(e.target.value)} />
}
