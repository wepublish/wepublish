import React, {useState} from 'react'
import nanoid from 'nanoid'

interface ColorPickerProps {
  withColor: (color: string) => void
  currentColor?: string
  label?: string
}

export function ColorPicker({withColor, currentColor = 'black', label}: ColorPickerProps) {
  const [color, setColor] = useState(currentColor)
  const id = nanoid()
  return (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="color"
        value={color}
        onChange={e => {
          setColor(e.target.value)
          withColor(color)
        }}
        style={{cursor: 'pointer'}}
      />
    </>
  )
}
