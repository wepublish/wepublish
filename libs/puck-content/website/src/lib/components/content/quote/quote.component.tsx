import { useQuery } from '@apollo/client/react';
import { PuckComponent } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/website/api';
import { BuilderQuoteBlockProps, QuoteBlock } from '@wepublish/website/builder';

import { datasourceIds } from '@wepublish/puck-content/editor';
import { WithDataSource } from '../../with-datasource';

export type QuoteConfigProps = WithDataSource<BuilderQuoteBlockProps>;

export const QuoteRender: PuckComponent<QuoteConfigProps> = ({
  datasources,
  ...props
}) => {
  const [imageId] = datasourceIds(datasources, 'image');
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
