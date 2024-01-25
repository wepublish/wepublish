import Grid from '@mui/material/Unstable_Grid2'
import {styled} from '@mui/material'
import {MainGrid} from '../main-grid'

export const footerMarginTop = 30

const StyledMainContainer = styled(MainGrid)`
  min-height: initial;
  grid-template-rows: initial;
  grid-column: -1/1;
  background-color: ${({theme}) => theme.palette.primary.main};
  margin-top: ${footerMarginTop}px;
`

const FooterLogo = styled('img')`
  height: 30px;

  ${({theme}) => theme.breakpoints.up('xl')} {
    height: 60px;
  }
`

const FooterAddress = styled(Grid)`
  font: normal normal 300 12px/15px ${({theme}) => theme.breakpoints.up('xl')} {
    font: normal normal 300 20px/24px;
  }
`

export function BajourFooter() {
  return (
    <StyledMainContainer>
      <Grid
        container
        xsOffset={1}
        xs={10}
        lgOffset={0}
        lg={12}
        xlOffset={2}
        xl={8}
        justifyContent={'space-between'}
        alignItems={'center'}
        paddingTop={1}
        paddingBottom={1}>
        {/* logo */}
        <Grid xs={'auto'}>
          <FooterLogo src={'/images/logo.svg'} alt={'logo'} />
        </Grid>

        {/* address */}
        <FooterAddress xs={'auto'}>
          <b>bajour</b>
          <br />
          Clarastrasse 10 <br />
          4058 Basel
        </FooterAddress>
      </Grid>
    </StyledMainContainer>
  )
}
