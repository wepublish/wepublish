import React, {ReactNode, Children, Fragment} from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {whenDesktop, whenTablet} from '../style/helpers'
import {Color} from '../style/colors'
import {usePermanentVisibility} from '../utils/hooks'

export interface GridStyleProps {
  numColumns: number
}

export const GridStyle = cssRule((props: GridStyleProps) => ({
  width: '100%'
}))

export interface GridBlockProps {
  numColumns: number
  children?: ReactNode
}

export function GridBlock({numColumns, children}: GridBlockProps) {
  const css = useStyle<GridStyleProps>({numColumns})

  let childrenArray = Children.toArray(children)

  const numMissingChildren =
    childrenArray.length % numColumns == 0 ? 0 : numColumns - (childrenArray.length % numColumns)

  childrenArray = [...childrenArray, ...new Array(numMissingChildren)]

  const rows = childrenArray.reduce<ReactNode[][]>((acc, child, index) => {
    const rowIndex = Math.floor(index / numColumns)
    const columnIndex = index % numColumns

    if (!acc[rowIndex]) {
      acc[rowIndex] = []
    }

    acc[rowIndex][columnIndex] = child

    return acc
  }, [])

  return (
    <div className={css(GridStyle)}>
      <Row>
        {rows.map((columns, index) => (
          <Fragment key={index}>
            {columns.map((child, index) => (
              <Column key={index} numColumns={numColumns}>
                {child}
              </Column>
            ))}
          </Fragment>
        ))}
      </Row>
    </div>
  )
}

export const RowStyle = cssRule(() => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  width: '100%'
}))

export interface RowProps {
  children?: ReactNode
}

export function Row({children}: RowProps) {
  const css = useStyle()
  return <div className={css(RowStyle)}>{children}</div>
}

export const ColumnStyle = cssRule(() => ({
  display: 'flex',
  flexDirection: 'column',
  flexBasis: '100%',
  overflow: 'hidden',
  borderBottom: `1px solid ${Color.Primary}`
}))

export const ThirdColumnStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  borderRight: `1px solid ${Color.Primary}`,
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  ...whenTablet({
    width: '50%',
    flexBasis: 'auto',

    ':nth-child(2n)': {
      transitionDelay: '200ms',
      borderRight: 'none'
    }
  }),

  ...whenDesktop({
    width: '33.33%',
    flexBasis: 'auto',

    ':nth-child(3n -1)': {
      transitionDelay: '200ms'
    },

    ':nth-child(3n)': {
      transitionDelay: '400ms',
      borderRight: 'none'
    },

    ':nth-child(3n + 1)': {
      transitionDelay: '0s'
    }
  })
}))

export interface ColumnProp {
  children?: ReactNode
  numColumns: number
}

export function Column({children, numColumns}: ColumnProp) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div ref={ref} className={css(ColumnStyle, numColumns > 1 ? ThirdColumnStyle : cssRule({}))}>
      {children}
    </div>
  )
}
