import { ActionBar, createUsePuck, useGetPuck } from '@puckeditor/core';
import {
  LINKED_TEMPLATE_TYPE,
  LinkedTemplateData,
} from '@wepublish/puck-content/website';
import { MdLinkOff, MdOpenInNew } from 'react-icons/md';

import { usePuckBlockData } from '../block-data/puck-block-data.context';
import { useEditorTranslation } from '../website-translations/editor-translation';
import { insertBlocks, removeBlockAt, unlinkedContent } from './saved-blocks';

const usePuck = createUsePuck();

const ROOT_ZONE = 'root:default-zone';

export const LinkedTemplateActions = () => {
  const { t } = useEditorTranslation();
  const getPuck = useGetPuck();
  const dispatch = usePuck(puck => puck.dispatch);
  const selectedItem = usePuck(puck => puck.selectedItem);
  const itemSelector = usePuck(puck => puck.appState.ui.itemSelector);
  const data = usePuckBlockData(
    selectedItem?.props.id ?? ''
  ) as LinkedTemplateData;

  if (selectedItem?.type !== LINKED_TEMPLATE_TYPE || !itemSelector) {
    return null;
  }

  const templateId = selectedItem.props['templateId'];
  const template = data.template;

  const unlink = () => {
    if (!template) {
      return;
    }

    const zone = itemSelector.zone ?? ROOT_ZONE;
    const { index } = itemSelector;

    dispatch({
      type: 'setData',
      recordHistory: true,
      data: insertBlocks(
        removeBlockAt(getPuck().appState.data, zone, index),
        zone,
        index,
        unlinkedContent(template)
      ),
    });
    dispatch({ type: 'setUi', ui: { itemSelector: { index, zone } } });
  };

  return (
    <>
      <ActionBar.Action
        label={t('puck.linkedTemplate.edit')}
        disabled={typeof templateId !== 'string'}
        onClick={() =>
          window.open(
            `/puck/templates/blocks/edit/${templateId}`,
            '_blank',
            'noopener,noreferrer'
          )
        }
      >
        <MdOpenInNew size={16} />
      </ActionBar.Action>
      <ActionBar.Action
        label={t('puck.linkedTemplate.unlink')}
        disabled={!template}
        onClick={unlink}
      >
        <MdLinkOff size={16} />
      </ActionBar.Action>
    </>
  );
};
