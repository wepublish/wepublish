import {css, styled} from '@mui/material'
import {createContext, useContext, PropsWithChildren, ComponentProps} from 'react'
import {
  BreakBlockWrapper,
  ImageBlockWrapper,
  QuoteBlockWrapper,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockWrapper
} from '@wepublish/block-content/website'

export const ContentWidthContext = createContext({
  fullWidth: false
})

export const ContentWidthProvider = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<(typeof ContentWidthContext)['Provider']>['value']>) => {
  return <ContentWidthContext.Provider value={props}>{children}</ContentWidthContext.Provider>
}

export const useFullWidthContent = () => {
  const context = useContext(ContentWidthContext)

  return context.fullWidth ?? false
}

export const ContentWrapperStyled = styled('article')<{fullWidth?: boolean}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(7)};

  ${({theme, fullWidth}) =>
    !fullWidth &&
    css`
      ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(12, 1fr);

        & > * {
          grid-column: 4/10;
        }

        & > :is(${ImageBlockWrapper}, ${BreakBlockWrapper},) {
          grid-column: 2/12;
        }

        &
          > :is(
            ${TeaserGridFlexBlockWrapper}, ${TeaserGridBlockWrapper}, ${TeaserListBlockWrapper}
          ) {
          grid-column: -1/1;
        }

        & > ${QuoteBlockWrapper} {
          grid-column-start: 5;
        }
      }
    `}
`

export const ContentWrapper = (
  props: Omit<ComponentProps<typeof ContentWrapperStyled>, 'fullWidth'>
) => {
  const fullWidth = useFullWidthContent()

  return <ContentWrapperStyled fullWidth={fullWidth} {...props} />
}
