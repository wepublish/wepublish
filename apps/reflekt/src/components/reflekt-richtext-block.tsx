import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { ReflektRenderRichtextType } from './reflekt-render-richtext';

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
    <RichTextBlockWrapper className={className}>
      <ReflektRenderRichtext
        elements={richText ?? []}
        variant={variant}
      />
    </RichTextBlockWrapper>
  );
};
