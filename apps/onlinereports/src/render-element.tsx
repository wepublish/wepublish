import { css } from '@mui/material';
import { BlockFormat } from '@wepublish/richtext';
import { RenderElement } from '@wepublish/richtext/website';
import {
  BuilderRenderElementProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const lastChildNoGutter = css`
  &:last-child {
    margin-bottom: 0;
  }
`;
export function OnlineReportsRenderElement(
  props: BuilderRenderElementProps
): JSX.Element {
  const {
    elements: { H2, H3, H4 },
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  const { element } = props;

  switch (element.type) {
    case BlockFormat.H1:
      return (
        <H2
          component="h2"
          gutterBottom
          css={lastChildNoGutter}
        >
          <RenderRichtext elements={element.children} />
        </H2>
      );

    case BlockFormat.H2:
      return (
        <H3
          component="h3"
          gutterBottom
          css={lastChildNoGutter}
        >
          <RenderRichtext elements={element.children} />
        </H3>
      );

    case BlockFormat.H3:
      return (
        <H4
          component="h4"
          gutterBottom
          css={lastChildNoGutter}
        >
          <RenderRichtext elements={element.children} />
        </H4>
      );
    default:
      return <RenderElement {...props} />;
  }
}
