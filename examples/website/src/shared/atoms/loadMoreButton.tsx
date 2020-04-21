import React from 'react'
import {cssRule} from '@karma.run/react'
import {BaseButton} from './baseButton'
import {pxToRem, whenDesktop} from '../style/helpers'
import {PrimaryButton} from './primaryButton'

export const LoadMoreButtonStyle = cssRule({
  fontSize: pxToRem(12),
  order: 3,
  width: '100%',
  margin: '20px',

  ...whenDesktop({
    textAlign: 'center',
    flexBasis: '25%'
  })
})

export interface LoadMoreButtonProps {
  readonly onLoadMore: () => void
}

export function LoadMoreButton({onLoadMore}: LoadMoreButtonProps) {
  return (
    <BaseButton css={LoadMoreButtonStyle} onClick={onLoadMore}>
      <PrimaryButton text="Load more" />
    </BaseButton>
  )
}
