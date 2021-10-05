import React, {useState, useRef} from 'react'

import {IconProps} from 'rsuite'

export interface FileDropInputProps {
  disabled?: boolean

  icon?: React.ReactElement<IconProps>
  text?: string

  onDrop: (fileList: File[]) => void
}

export function FileDropInput({disabled = false, onDrop, icon, text}: FileDropInputProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragIn(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()

    setDragging(true)
  }

  function handleDragOut(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()

    setDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()

    setDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(Array.from(e.dataTransfer.files))
      e.dataTransfer.clearData()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      onDrop(Array.from(e.target.files))
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        height: '100%',

        paddingTop: '20px',
        paddingBottom: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',

        borderRadius: 3,

        borderStyle: 'dashed',
        borderWidth: '3px',
        borderColor: dragging ? '#3498ff' : '#004299',

        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        textAlign: 'center',

        opacity: disabled ? 0.5 : 1,

        color: dragging ? '#3498ff' : '#004299',
        fill: dragging ? '#3498ff' : '#004299'
      }}
      onDrop={!disabled ? handleDrop : undefined}
      onDragOver={!disabled ? handleDragIn : undefined}
      onDragLeave={!disabled ? handleDragOut : undefined}
      onClick={() => inputRef.current!.click()}>
      {icon && icon}
      <div>{text}</div>
      <input
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          opacity: 0
        }}
        ref={inputRef}
        type="file"
        value={''}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  )
}
