import {
  BuilderRenderRichtextProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export function RenderRichtext({ document }: BuilderRenderRichtextProps) {
  const {
    richtext: { RenderElement },
  } = useWebsiteBuilder();

  return document?.content?.map((element, key) => (
    <RenderElement
      key={key}
      element={element}
    />
  ));
}
