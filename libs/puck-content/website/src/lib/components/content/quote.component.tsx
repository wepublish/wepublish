import { PuckComponent } from '@puckeditor/core';
import { useImageQuery } from '@wepublish/website/api';
import { BuilderQuoteBlockProps, QuoteBlock } from '@wepublish/website/builder';

export type QuoteConfigProps = BuilderQuoteBlockProps & { imageId?: string };

export const QuoteRender: PuckComponent<QuoteConfigProps> = ({
  imageId,
  ...props
}) => {
  const { data } = useImageQuery({
    variables: { id: imageId ?? '' },
    skip: !imageId,
  });

  return (
    <QuoteBlock
      {...props}
      image={data?.image}
    />
  );
};
