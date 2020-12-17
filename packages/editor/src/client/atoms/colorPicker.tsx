import React from 'react'
import nanoid from 'nanoid'

interface ColorPickerProps {
  withColor: (color: string) => void
  currentColor?: string
  label?: string
}

export function ColorPicker({withColor, currentColor = '#000', label}: ColorPickerProps) {
  const id = nanoid()
  return (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="color"
        value={currentColor}
        onChange={e => withColor(e.target.value)}
        style={{cursor: 'pointer'}}
      />
    </>
  )
}
