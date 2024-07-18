import {css, GlobalStyles, styled, Theme} from '@mui/material'
import {ContentWidthProvider, Page} from '@wepublish/website'
import {BuilderPageProps} from '@wepublish/website'

const fullWidthMainSpacer = (theme: Theme) => css`
  main > .MuiContainer-root {
    max-width: initial;
    padding: 0;
  }
`

const StyledMannschaftPage = styled(Page)`
  & > .MuiContainer-root {
    max-width: initial;
    grid-template-columns: minmax(auto, ${({theme}) => theme.breakpoints.values['lg']}px);
    justify-content: center;
  }

  & > :last-child {
    // Makes it gapless with footer
    margin-bottom: -${({theme}) => theme.spacing(3)};
  }
`

export const MannschaftPage = (props: BuilderPageProps) => {
  return (
    <ContentWidthProvider fullWidth>
      <GlobalStyles styles={fullWidthMainSpacer} />

      <StyledMannschaftPage {...props} />
    </ContentWidthProvider>
  )
}
