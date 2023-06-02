import {styled} from '@mui/material'
import {memo, ReactNode} from 'react'

export type MountainNameProps = {
  x: number
  name: ReactNode
}

const MountainNameWrapper = styled('div')<Pick<MountainNameProps, 'x'>>`
  position: absolute;
  left: ${({x}) => x * 100}%;
  bottom: 5px;
  transform: translateX(-50%);
  word-break: normal;
`

const MountainName = ({x, name}: MountainNameProps) => (
  <MountainNameWrapper x={x}>
    <strong>
      <small>{name}</small>
    </strong>
  </MountainNameWrapper>
)

const ConnectedMountainName = memo(MountainName)
export {ConnectedMountainName as MountainName}
