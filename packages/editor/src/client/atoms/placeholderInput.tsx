import React, {ReactNode} from 'react'

import {Icon, IconButton} from 'rsuite'

export interface PlaceholderInputProps {
  /**
   * Setting children will directly render them.
   */
  children?: ReactNode

  /**
   * Called when the add button is clicked.
   */
  onAddClick?: () => void
}

/**
 * A placeholder for a block.
 */
export function PlaceholderInput({children, onAddClick}: PlaceholderInputProps) {
  if (children) {
    return <>{children}</>
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9fa'
      }}>
      <IconButton
        size={'lg'}
        icon={<Icon icon="plus-circle" size="5x" />}
        onClick={() => onAddClick && onAddClick()}
      />
    </div>
  )
}
