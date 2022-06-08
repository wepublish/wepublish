import React, {ReactNode} from 'react'

import {IconButton} from 'rsuite'
import PlusCircleIcon from '@rsuite/icons/legacy/PlusCircle'

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
        maxHeight: 450,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9fa'
      }}>
      <IconButton
        size={'sm'}
        icon={<PlusCircleIcon />}
        onClick={() => onAddClick && onAddClick()}
      />
    </div>
  )
}
