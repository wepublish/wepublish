import {
  getSlot,
  PuckBlockComponent,
  TeaserCard,
  TeaserConfigProps,
  TeaserRender,
  useTeaserSlot,
} from '@wepublish/puck-content/website';

import { useEditorTranslation } from '../../../website-translations/editor-translation';
import { TeaserEditorHint } from './teaser-editor.styles';

export type TeaserEditorExtra = {
  editing: boolean;
};

export const TeaserEditorPlaceholder = () => {
  const { t } = useEditorTranslation();

  return (
    <TeaserEditorHint role="status">
      {t('puck.teaser.noRecord')}
    </TeaserEditorHint>
  );
};

export const TeaserEditorRender: PuckBlockComponent<
  TeaserConfigProps,
  TeaserEditorExtra
> = ({ editing, ...renderProps }) => {
  const teaser = useTeaserSlot();

  if (!editing) {
    return <TeaserRender {...renderProps} />;
  }

  return (
    <TeaserCard className={renderProps.className}>
      {!teaser && <TeaserEditorPlaceholder />}
      {getSlot(renderProps.slots, 'content')()}
    </TeaserCard>
  );
};
