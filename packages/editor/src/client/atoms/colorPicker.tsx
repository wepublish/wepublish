import React from 'react'

interface ColorPickerProps {
  currentColor: string
  withColor: (emoji: string) => void
}

export function ColorPicker({currentColor, withColor}: ColorPickerProps) {
  return <input type="color" value={currentColor} onChange={e => withColor(e.target.value)} />
}
