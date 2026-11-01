type EditableItem = {
  id: string;
  latest: { puckBlocks?: ReadonlyArray<unknown> | null };
};

export const editorPath = (
  kind: 'articles' | 'pages',
  { id, latest }: EditableItem
) => (latest.puckBlocks ? `/puck/${kind}/edit/${id}` : `/${kind}/edit/${id}`);
