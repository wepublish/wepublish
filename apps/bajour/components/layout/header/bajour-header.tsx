import Grid from '@mui/material/Unstable_Grid2'
import {MdSearch, MdMenu} from 'react-icons/md'
import {styled, Theme} from '@mui/material'
import {ApiV1} from '@wepublish/website'
import {NextWepublishLink} from '../../should-be-website-builder/next-wepublish-link'

const StickyGrid = styled(Grid)`
  position: sticky;
  top: 0;
  left: 0;
  background-color: white;
  z-index: 1 !important;
  padding-top: 10px;
  padding-bottom: 10px;

  ${({theme}) => theme.breakpoints.up('sm')} {
    margin-top: 20px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    margin-top: 30px;
  }
`

const TagGrid = styled(Grid)`
  padding-top: 10px;
  max-width: 100%;
  display: inline;
  overflow-x: auto;
  flex-wrap: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-top: 0;
  }
`

const HeaderLogo = styled('img')`
  height: 37px;

  ${({theme}) => theme.breakpoints.up('md')} {
    height: 58px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    height: 68px;
  }
`

const iconStyle = ({theme}: {theme: Theme}) => `
  margin-top: 5px;
  font-size: 30px;

  ${theme.breakpoints.up('md')} {
    font-size: 40px;
  }

  ${theme.breakpoints.up('lg')} {
    font-size: 50px;
  }
`

const StyledSearch = styled(MdSearch)`
  ${iconStyle}
`

const StyledMenu = styled(MdMenu)`
  ${iconStyle}
`

/**
 * other styling
 */
const HorizontalTagLineContainer = styled(Grid)`
  padding-top: 10px;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-top: 0;
    margin-top: -20px;
  }
`

const HorizontalTagLine = styled('div')`
  width: 100%;
  height: 1px;
  background-color: black;
`

const TagLinks = styled(NextWepublishLink)`
  white-space: nowrap;
  color: black;
  letter-spacing: 0.55px;
  font: normal normal 300 11px/28px;
  text-decoration: none;

  ${({theme}) => theme.breakpoints.up('sm')} {
    font-size: 14px;
    letter-spacing: 0.7px;
  }
`

export function BajourHeader() {
  const {data: navigations} = ApiV1.useNavigationQuery({
    variables: {
      slug: 'header-tags'
    }
  })

  return (
    <StickyGrid xs={12} container>
      {/* logo and burger menu */}
      <Grid xsOffset={1} xs={10} lgOffset={0} lg={12} xlOffset={3} xl={6} container>
        {/* logo */}
        <Grid xs={6}>
          <NextWepublishLink href={'/'}>
            <HeaderLogo src={'/images/logo.svg'} alt={'logo'} />
          </NextWepublishLink>
        </Grid>
        {/* burger menu & search */}
        <Grid xs={6} alignItems={'center'} justifyContent={'end'} container>
          <Grid>
            <StyledSearch />
          </Grid>
          <Grid sx={{paddingLeft: '8px'}}>
            <StyledMenu />
          </Grid>
        </Grid>
      </Grid>

      {/* horizontal tag line */}
      <HorizontalTagLineContainer
        xsOffset={4}
        xs={4}
        mdOffset={(12 - 3) / 2}
        md={3}
        lgOffset={5}
        lg={2}>
        <HorizontalTagLine />
      </HorizontalTagLineContainer>

      {/* tags */}
      <Grid container xsOffset={1 / 3} xs={10 + 2 * (2 / 3)} justifyContent={'center'}>
        <TagGrid xs={'auto'} container justifyContent={'start'}>
          {navigations &&
            navigations.navigation?.links.map((link, index) => (
              <TagLinks
                href={link.__typename === 'ExternalNavigationLink' ? link.url : ''}
                key={index}
                style={{marginLeft: !index ? 0 : '30px'}}>
                {link.label}
              </TagLinks>
            ))}
        </TagGrid>
      </Grid>
    </StickyGrid>
  )
}
