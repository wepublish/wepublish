export const LIVE_REVALIDATE_SECONDS = 60;
export const REVALIDATE_SECONDS = 60 * 60;

const LIVE_BLOCKS = new Set(['PollBlock', 'CrowdfundingBlock']);

const hasLiveBlock = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(hasLiveBlock);
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const node = value as { __typename?: unknown; disabled?: unknown };

  if (node.disabled === true) {
    return false;
  }

  if (typeof node.__typename === 'string' && LIVE_BLOCKS.has(node.__typename)) {
    return true;
  }

  return Object.values(value).some(hasLiveBlock);
};

export const revalidateFor = (content: unknown, errors?: readonly unknown[]) =>
  !content || errors?.length || hasLiveBlock(content) ?
    LIVE_REVALIDATE_SECONDS
  : REVALIDATE_SECONDS;
