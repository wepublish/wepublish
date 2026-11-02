import {
  HideWhenEmptyProps,
  isTeaserPartEmpty,
  PuckBlockComponent,
  PuckBlockRenderProps,
  TeaserPartType,
  TeaserSlotContext,
} from '@wepublish/puck-content/website';
import { useContext } from 'react';

import { useEditorTranslation } from '../../../website-translations/editor-translation';
import { TeaserPartPlaceholder } from './teaser-part-editor.styles';

export type TeaserPartEditorExtra = {
  editing: boolean;
};

export type TeaserPartEditorBlockProps<Props extends HideWhenEmptyProps> =
  PuckBlockRenderProps<Props, TeaserPartEditorExtra> & {
    part: TeaserPartType;
    render: PuckBlockComponent<Props>;
  };

export const TeaserPartEditorBlock = <Props extends HideWhenEmptyProps>({
  part,
  render: Render,
  editing,
  ...renderProps
}: TeaserPartEditorBlockProps<Props>) => {
  const { t } = useEditorTranslation();
  const teaser = useContext(TeaserSlotContext);

  if (!editing || teaser === undefined || !isTeaserPartEmpty(part, teaser)) {
    return <Render {...renderProps} />;
  }

  const name = t(`puck.blocks.names.${part}`);

  return (
    <TeaserPartPlaceholder
      role="status"
      className={renderProps.className}
    >
      {renderProps.props.hideWhenEmpty === false ?
        t('puck.teaser.emptyKept', { part: name })
      : t('puck.teaser.emptyHidden', { part: name })}
    </TeaserPartPlaceholder>
  );
};
