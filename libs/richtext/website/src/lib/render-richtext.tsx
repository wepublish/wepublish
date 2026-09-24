import { normalizeListNesting } from '@wepublish/richtext';
import {
  BuilderRenderRichtextProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

export function RenderRichtext({ document }: BuilderRenderRichtextProps) {
  const {
    richtext: { RenderElement },
  } = useWebsiteBuilder();

  const normalizedDocument = useMemo(
    () => (document ? normalizeListNesting(document) : document),
    [document]
  );

  return normalizedDocument?.content?.map((element, key) => (
    <RenderElement
      key={key}
      element={element}
    />
  ));
}
