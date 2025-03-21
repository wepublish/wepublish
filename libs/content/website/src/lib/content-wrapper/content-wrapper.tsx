import {css} from '@mui/material'
import styled from '@emotion/styled'
import {createContext, useContext, PropsWithChildren, ComponentProps} from 'react'
import {
  BreakBlockWrapper,
  EventBlockWrapper,
  ImageBlockWrapper,
  ImageGalleryBlockWrapper,
  SliderWrapper,
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

        &
          > :is(
            ${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}, ${BreakBlockWrapper}
          ) {
          grid-column: 2/12;
        }

        &
          > :is(
            ${TeaserGridFlexBlockWrapper},
              ${TeaserGridBlockWrapper},
              ${TeaserListBlockWrapper},
              ${ImageGalleryBlockWrapper}
          ) {
          grid-column: -1/1;
        }
      }
    `}
`

export const ContentWrapper = (props: ComponentProps<typeof ContentWrapperStyled>) => {
  const fullWidth = useFullWidthContent()

  return <ContentWrapperStyled fullWidth={fullWidth} {...props} />
}
