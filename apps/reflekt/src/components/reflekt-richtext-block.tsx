import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const ReflektRichTextBlock = ({
  className,
  richText,
  variant,
}: BuilderRichTextBlockProps & { variant?: string }) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  return (
    <RichTextBlockWrapper className={className}>
      <RenderRichtext
        elements={richText ?? []}
        variant={variant}
      />
    </RichTextBlockWrapper>
  );
};
