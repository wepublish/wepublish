import {Theme, css, styled, useTheme} from '@mui/material'
import {ReactComponent as Logo} from '../logo.svg'
import {useWebsiteBuilder} from '@wepublish/website'
import {transparentize} from 'polished'

const HeaderWrapper = styled('div')`
  display: grid;
  grid-template-columns: 150px;
  justify-content: center;
  box-shadow: 0 0 25px ${({theme}) => transparentize(0.4, theme.palette.secondary.light)};
`

const logoStyles = (theme: Theme) => css`
  color: ${theme.palette.common.black};
  position: relative;
  top: 1em;

  &:hover {
    color: ${theme.palette.secondary.main};
  }
`

export const Header = () => {
  const theme = useTheme()
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <HeaderWrapper>
      <Link href="https://bajour.ch" css={logoStyles(theme)}>
        <Logo />
      </Link>
    </HeaderWrapper>
  )
}
