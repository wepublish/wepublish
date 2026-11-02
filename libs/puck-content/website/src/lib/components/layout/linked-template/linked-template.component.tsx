import { PuckBlockComponent } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import { useNestedPuckBlocks } from '../../../contexts/nested-puck-blocks.context';
import {
  LINKED_TEMPLATE_SLOT,
  linkedTemplateBlocks,
  LinkedTemplateData,
  LinkedTemplateProps,
} from './linked-template';

export const LinkedTemplateRender: PuckBlockComponent<
  LinkedTemplateProps,
  object,
  LinkedTemplateData
> = ({ data, slots, className, ref }) => {
  const renderNested = useNestedPuckBlocks();
  const template = data.template;
  const nested = slots[LINKED_TEMPLATE_SLOT];

  if (!nested && (!template || !renderNested)) {
    return null;
  }

  return (
    <div
      className={className}
      ref={ref as never}
    >
      {nested ?
        getSlot(slots, LINKED_TEMPLATE_SLOT)()
      : template &&
        renderNested?.({
          blocks: linkedTemplateBlocks(template),
          registry: template.puckRegistry,
        })
      }
    </div>
  );
};
