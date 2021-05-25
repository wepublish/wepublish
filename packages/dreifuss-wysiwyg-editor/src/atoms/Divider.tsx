import React from 'react'

export enum DividerType {
  horizontal = 'Horizontal',
  vertical = 'Vertical'
}
interface DividerProps {
  type: DividerType
}

export const Divider = (props: DividerProps) => (
  <hr
    style={{
      margin: props.type === DividerType.vertical ? '0 10px' : '10px 0',
      height: props.type === DividerType.vertical ? '22px' : undefined,
      borderLeft: '1px solid black'
    }}
  />
)

export default Divider
