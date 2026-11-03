import {
  LinkedTemplateData,
  linkedTemplateBlocks,
  LinkedTemplateProps,
  PuckBlockComponent,
  PuckBlocks,
} from '@wepublish/puck-content/website';

import { useHasPuckBlockData } from '../../../block-data/puck-block-data.context';
import { useEditorTranslation } from '../../../website-translations/editor-translation';
import {
  LinkedTemplateBadge,
  LinkedTemplateContent,
  LinkedTemplateFrame,
  LinkedTemplateHint,
} from './linked-template.styles';

export const LinkedTemplateCanvas: PuckBlockComponent<
  LinkedTemplateProps,
  object,
  LinkedTemplateData
> = ({ id, data, className }) => {
  const { t } = useEditorTranslation();
  const loaded = useHasPuckBlockData(id);
  const template = data.template;

  return (
    <LinkedTemplateFrame className={className}>
      {template ?
        <>
          <LinkedTemplateBadge>
            {t('puck.linkedTemplate.badge', { name: template.name })}
          </LinkedTemplateBadge>
          <LinkedTemplateContent inert>
            <PuckBlocks
              blocks={linkedTemplateBlocks(template)}
              registry={template.puckRegistry}
            />
          </LinkedTemplateContent>
        </>
      : <LinkedTemplateHint>
          {loaded ?
            t('puck.linkedTemplate.missing')
          : t('puck.linkedTemplate.loading')}
        </LinkedTemplateHint>
      }
    </LinkedTemplateFrame>
  );
};
