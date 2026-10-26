import { useQuery } from '@apollo/client/react';
import { PuckComponent } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/website/api';
import { BuilderQuoteBlockProps, QuoteBlock } from '@wepublish/website/builder';

export type QuoteConfigProps = BuilderQuoteBlockProps & { imageId?: string };

export const QuoteRender: PuckComponent<QuoteConfigProps> = ({
  imageId,
  ...props
}) => {
  const { data } = useQuery(ImageDocument, {
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
