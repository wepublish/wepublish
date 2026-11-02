type EditableItem = {
  id: string;
  latest: { puckBlocks?: ReadonlyArray<unknown> | null };
};

export const editorPath = (
  kind: 'articles' | 'pages',
  { id, latest }: EditableItem
) => (latest.puckBlocks ? `/puck/${kind}/edit/${id}` : `/${kind}/edit/${id}`);

export type EditableTemplate = {
  id: string;
  blockTemplate: { puckBlocks?: ReadonlyArray<unknown> | null };
};

export const hasPuckBlocks = ({
  puckBlocks,
}: {
  puckBlocks?: ReadonlyArray<unknown> | null;
}) => !!puckBlocks;

export const isPuckTemplate = ({ blockTemplate }: EditableTemplate) =>
  hasPuckBlocks(blockTemplate);
