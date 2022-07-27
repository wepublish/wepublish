import React from 'react'
import nanoid from 'nanoid'

interface ColorPickerProps {
  setColor: (color: string) => void
  currentColor?: string
  label?: string
  disabled?: boolean
}

export function ColorPicker({setColor, currentColor, label, disabled}: ColorPickerProps) {
  const id = nanoid()
  return (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        disabled={disabled ?? false}
        id={id}
        type="color"
        value={currentColor}
        onChange={e => {
          setColor(e.target.value)
        }}
        style={{cursor: 'pointer'}}
      />
    </>
  )
}
