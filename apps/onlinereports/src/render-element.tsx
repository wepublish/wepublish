import { css } from '@mui/material';
import { RichtextElements } from '@wepublish/richtext';
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
export function OnlineReportsRenderElement(props: BuilderRenderElementProps) {
  const {
    elements: { H2, H3, H4 },
    richtext: { RenderElement: RenderElementInner },
  } = useWebsiteBuilder();

  const { element } = props;

  if (element.type === 'heading') {
    const children = (element.content as RichtextElements[])?.map((el, key) => (
      <RenderElementInner
        key={key}
        element={el}
      />
    ));

    if (element.attrs.level === 3) {
      return (
        <H2
          component="h2"
          gutterBottom
          css={lastChildNoGutter}
        >
          {children}
        </H2>
      );
    }

    if (element.attrs.level === 4) {
      return (
        <H3
          component="h3"
          gutterBottom
          css={lastChildNoGutter}
        >
          {children}
        </H3>
      );
    }

    if (element.attrs.level === 5) {
      return (
        <H4
          component="h4"
          gutterBottom
          css={lastChildNoGutter}
        >
          {children}
        </H4>
      );
    }
  }

  return <RenderElement {...props} />;
}
