import { css, Theme } from '@emotion/react';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { ReflektRenderRichtextType } from './reflekt-render-richtext';

const headingListGap = (theme: Theme) => css`
  & > .MuiTypography-h4 + :is(ul, ol) {
    margin-top: ${theme.spacing(3)};
  }
`;

export const ReflektRichTextBlock = ({
  className,
  richText,
  variant,
}: BuilderRichTextBlockProps & { variant?: string }) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  const ReflektRenderRichtext = RenderRichtext as ReflektRenderRichtextType;

  return (
    <RichTextBlockWrapper
      className={className}
      css={headingListGap}
    >
      <ReflektRenderRichtext
        document={richText}
        variant={variant}
      />
    </RichTextBlockWrapper>
  );
};
