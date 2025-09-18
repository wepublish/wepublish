export const hasBlockStyle =
  (blockStyle: string) =>
  <T extends { blockStyle?: string | null }>(block: T) =>
    block.blockStyle === blockStyle;
