import { PuckComponent } from '@puckeditor/core';
import { useImageQuery } from '@wepublish/website/api';
import { BreakBlock, BuilderBreakBlockProps } from '@wepublish/website/builder';

import { useOverlayPortalOnModifier } from '@wepublish/puck-content/editor';

export type BreakConfigProps = BuilderBreakBlockProps & { imageId?: string };

export const BreakRender: PuckComponent<BreakConfigProps> = ({
  imageId,
  ...props
}) => {
  const { data } = useImageQuery({
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
