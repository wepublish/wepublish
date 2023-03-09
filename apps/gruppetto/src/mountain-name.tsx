import {styled} from '@mui/material'
import {ReactNode} from 'react'

export type MountainNameProps = {
  milestone: {x: number}
  name: ReactNode
}

const MountainNameWrapper = styled('div')<Pick<MountainNameProps, 'milestone'>>`
  position: absolute;
  left: ${({milestone}) => milestone.x * 100}%;
  bottom: 5px;
  transform: translateX(-50%);
  word-break: normal;
`

export const MountainName = ({milestone, name}: MountainNameProps) => (
  <MountainNameWrapper milestone={milestone}>
    <strong>
      <small>{name}</small>
    </strong>
  </MountainNameWrapper>
)
