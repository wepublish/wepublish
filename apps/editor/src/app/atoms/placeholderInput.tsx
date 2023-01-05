import styled from '@emotion/styled'
import {ReactNode} from 'react'
import {MdAddCircle} from 'react-icons/md'
import {IconButton} from 'rsuite'

const PlaceholderInputWrapper = styled.div<{maxHeight: number}>`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f7f9fa;
  max-height: ${({maxHeight}) => `${maxHeight}px`};
`

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
  minHeight?: number
}

/**
 * A placeholder for a block.
 */
export function PlaceholderInput({
  children,
  onAddClick,
  disabled,
  maxHeight = 450,
  minHeight
}: PlaceholderInputProps) {
  if (children) {
    return <>{children}</>
  }

  return (
    <PlaceholderInputWrapper maxHeight={maxHeight}>
      <IconButton
        disabled={disabled}
        size="sm"
        icon={<MdAddCircle />}
        onClick={() => onAddClick && onAddClick()}
      />
    </PlaceholderInputWrapper>
  )
}
