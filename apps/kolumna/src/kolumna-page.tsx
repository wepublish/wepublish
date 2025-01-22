import styled from '@emotion/styled'
import {css, GlobalStyles, Theme} from '@mui/material'
import {ContentWidthProvider, Page} from '@wepublish/website'
import {BuilderPageProps} from '@wepublish/website'

const fullWidthMainSpacer = (theme: Theme) => css`
  main > .MuiContainer-root {
    max-width: initial;
    padding: 0;
  }
`

const StyledKolumnaPage = styled(Page)`
  & > .MuiContainer-root {
    max-width: initial;
    grid-template-columns: minmax(auto, ${({theme}) => theme.breakpoints.values['lg']}px);
    justify-content: center;
  }
`

export const KolumnaPage = (props: BuilderPageProps) => {
  return (
    <ContentWidthProvider fullWidth>
      <GlobalStyles styles={fullWidthMainSpacer} />

      <StyledKolumnaPage {...props} />
    </ContentWidthProvider>
  )
}
