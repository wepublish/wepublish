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

  if (node.disabled) {
    return false;
  }

  if (typeof node.__typename === 'string' && LIVE_BLOCKS.has(node.__typename)) {
    return true;
  }

  return Object.values(value).some(hasLiveBlock);
};

const HIDDEN_CONTENT = /^Cannot return null for non-nullable field /;

type ApiError = {
  message?: unknown;
  extensions?: {
    status?: unknown;
    originalError?: { statusCode?: unknown };
  };
};

const isClientStatus = (status: unknown) =>
  typeof status === 'number' && status >= 400 && status < 500;

const isServerError = (error: unknown) => {
  const { message, extensions } = (error ?? {}) as ApiError;

  return !(
    isClientStatus(extensions?.status) ||
    isClientStatus(extensions?.originalError?.statusCode) ||
    (typeof message === 'string' && HIDDEN_CONTENT.test(message))
  );
};

export const revalidateFor = (
  content: unknown,
  errors?: readonly unknown[]
) => {
  const serverErrors =
    content || process.env.NEXT_PHASE === 'phase-production-build' ?
      []
    : (errors ?? []).filter(isServerError);

  if (serverErrors.length) {
    throw new Error(
      `The api failed to answer: ${serverErrors
        .map(error => String((error as ApiError).message))
        .join('; ')}`
    );
  }

  return !content || errors?.length || hasLiveBlock(content) ?
      LIVE_REVALIDATE_SECONDS
    : REVALIDATE_SECONDS;
};
