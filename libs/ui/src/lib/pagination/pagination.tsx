import {css, Pagination as MuiPagination} from '@mui/material'
import styled from '@emotion/styled'
import {ComponentProps} from 'react'

export type PaginationProps = ComponentProps<typeof MuiPagination>

export const center = css`
  display: grid;
  justify-items: center;
`

export function Pagination({className, ...props}: PaginationProps) {
  return <MuiPagination {...props} css={center} />
}
