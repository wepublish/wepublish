import {styled} from '@mui/material'
import {Link} from './link'
import {Logo} from './logo'

const HeaderWrapper = styled('div')`
  display: grid;
  grid-template-columns: 150px;
  justify-content: center;
  padding: ${({theme}) => theme.spacing(3)};
`

export const Header = () => (
  <HeaderWrapper>
    <Link href="/">
      <Logo />
    </Link>
  </HeaderWrapper>
)
