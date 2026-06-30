import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { ReflektRenderRichtextType } from './reflekt-render-richtext';

const ReflektRichTextBlockWrapper = styled(RichTextBlockWrapper)`
  & > .MuiTypography-h4 + :is(ul, ol) {
    margin-top: ${({ theme }) => theme.spacing(3)};
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
    <ReflektRichTextBlockWrapper className={className}>
      <ReflektRenderRichtext
        document={richText}
        variant={variant}
      />
    </ReflektRichTextBlockWrapper>
  );
};
