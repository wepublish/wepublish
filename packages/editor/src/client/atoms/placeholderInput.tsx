import React, {ReactNode} from 'react'
import {MdAddCircle} from 'react-icons/md'
import {IconButton} from 'rsuite'

export interface PlaceholderInputProps {
  /**
   * Setting children will directly render them.
   */
  children?: ReactNode

  /**
   * Called when the add button is clicked.
   */
  onAddClick?: () => void
  disabled?: boolean
  maxHeight?: number
}

/**
 * A placeholder for a block.
 */
export function PlaceholderInput({
  children,
  onAddClick,
  disabled,
  maxHeight = 450
}: PlaceholderInputProps) {
  if (children) {
    return <>{children}</>
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        maxHeight,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9fa'
      }}>
      <IconButton
        disabled={disabled}
        size="sm"
        icon={<MdAddCircle />}
        onClick={() => onAddClick && onAddClick()}
      />
    </div>
  )
}
