export const LINKED_TEMPLATE_TYPE = 'LinkedTemplate';
export const LINKED_TEMPLATE_SLOT = 'template';
export const MAX_LINKED_TEMPLATE_DEPTH = 5;

type StoredPuckBlock = {
  type?: unknown;
  props?: unknown;
  children?: unknown;
};

export const linkedTemplateIdsOf = (blocks: unknown): string[] => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as (StoredPuckBlock | null)[]).flatMap(block => {
    if (!block || typeof block !== 'object') {
      return [];
    }

    const templateId =
      block.type === LINKED_TEMPLATE_TYPE ?
        (block.props as Record<string, unknown> | undefined)?.['templateId']
      : undefined;

    return [
      ...(typeof templateId === 'string' && templateId ? [templateId] : []),
      ...linkedTemplateIdsOf(block.children),
    ];
  });
};
