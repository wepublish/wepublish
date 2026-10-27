import {
  BuilderRenderRichtextProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentType, Fragment } from 'react';

import { RichtextVariantContext } from './reflekt-richtext-variant-context';

export type ReflektRenderRichtextType = ComponentType<
  BuilderRenderRichtextProps & { variant?: string }
>;

export function ReflektRenderRichtext({
  document,
  variant,
}: BuilderRenderRichtextProps & { variant?: string }) {
  const {
    richtext: { RenderElement },
  } = useWebsiteBuilder();

  return (
    <RichtextVariantContext.Provider value={variant}>
      {document?.content?.map((element, index) => (
        <RenderElement
          key={index}
          element={element}
        />
      )) ?? <Fragment />}
    </RichtextVariantContext.Provider>
  );
}
