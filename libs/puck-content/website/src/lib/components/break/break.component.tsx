import { useQuery } from '@apollo/client/react';
import { PuckComponent } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/website/api';
import { BreakBlock, BuilderBreakBlockProps } from '@wepublish/website/builder';

import {
  datasourceIds,
  useOverlayPortalOnModifier,
} from '@wepublish/puck-content/editor';
import { WithDataSource } from '../with-datasource';

export type BreakConfigProps = WithDataSource<BuilderBreakBlockProps>;

export const BreakRender: PuckComponent<BreakConfigProps> = ({
  datasources,
  ...props
}) => {
  const [imageId] = datasourceIds(datasources, 'image');
  const { data } = useQuery(ImageDocument, {
    variables: { id: imageId ?? '' },
    skip: !imageId,
  });

  const buttonRef = useOverlayPortalOnModifier();

  return (
    <BreakBlock
      {...props}
      image={data?.image}
      refs={{ button: buttonRef }}
    />
  );
};
