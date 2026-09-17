import { RenderElement } from '@wepublish/richtext/website';
import { BuilderRenderElementProps } from '@wepublish/website/builder';

export const TsriRenderElement = ({ element }: BuilderRenderElementProps) => {
  const markTypes = element.marks?.map(mark => mark.type) || [];
  if (
    element.type === 'text' &&
    ['link', 'underline'].every(type => markTypes?.includes(type))
  ) {
    return (
      <RenderElement
        element={{
          ...element,
          marks: element.marks?.filter(mark => mark.type !== 'underline'),
        }}
      />
    );
  }

  return <RenderElement element={element} />;
};
