import {BuilderRenderElementProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {RenderElement} from '@wepublish/richtext/website'
import {BlockFormat} from '@wepublish/richtext'
import {css} from '@mui/material'

const lastChildNoGutter = css`
  &:last-child {
    margin-bottom: 0;
  }
`
export function OnlineReportsRenderElement(props: BuilderRenderElementProps): JSX.Element {
  const {
    elements: {H2, H3, H4}
  } = useWebsiteBuilder()

  const {attributes, children, element} = props

  switch (element.type) {
    case BlockFormat.H1:
      return (
        <H2 component="h2" {...attributes} gutterBottom css={lastChildNoGutter}>
          {children}
        </H2>
      )

    case BlockFormat.H2:
      return (
        <H3 component="h3" {...attributes} gutterBottom css={lastChildNoGutter}>
          {children}
        </H3>
      )

    case BlockFormat.H3:
      return (
        <H4 component="h4" {...attributes} gutterBottom css={lastChildNoGutter}>
          {children}
        </H4>
      )
    default:
      return <RenderElement {...props} />
  }
}
