import { ImagePlaceholderIcon } from '@wepublish/ui/editor';
import {
  firstDataImage,
  ImageConfigProps,
  ImageRender,
  PuckBlockComponent,
} from '@wepublish/puck-content/website';

import { useEditorTranslation } from '../../../website-translations/editor-translation';
import { ImageEditorPlaceholder } from './image-editor.styles';

export const ImageEditorRender: PuckBlockComponent<
  ImageConfigProps
> = props => {
  const { t } = useEditorTranslation();

  if (firstDataImage(props.data)) {
    return <ImageRender {...props} />;
  }

  return (
    <ImageEditorPlaceholder
      role="img"
      aria-label={t('puck.image.noImageSelected')}
      className={props.className}
    >
      <ImagePlaceholderIcon />
    </ImageEditorPlaceholder>
  );
};
